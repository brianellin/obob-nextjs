#!/usr/bin/env python3

import json
import sys
import os
from pathlib import Path
from collections import defaultdict, Counter
import glob

def find_questions_files(start_dir=None):
    """Find all questions.json files in the repository."""
    if start_dir is None:
        start_dir = Path.cwd()
    else:
        start_dir = Path(start_dir)
    
    # Look for questions.json files recursively
    questions_files = list(start_dir.rglob("questions.json"))
    
    # Filter out any that might be in node_modules or other irrelevant directories
    filtered_files = []
    for file in questions_files:
        path_parts = file.parts
        if 'node_modules' not in path_parts and '.git' not in path_parts:
            filtered_files.append(file)
    
    return filtered_files

def analyze_questions(questions_file):
    """Analyze questions.json file and provide detailed statistics."""
    
    questions_path = Path(questions_file)
    
    # Read the questions file
    try:
        with open(questions_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: File '{questions_file}' not found.")
        return None
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in '{questions_file}': {e}")
        return None
    
    questions = data.get('questions', [])
    
    if not questions:
        print("No questions found in the file.")
        return None
    
    # Initialize counters
    total_questions = len(questions)
    questions_by_type = Counter()
    questions_by_book = Counter()
    questions_by_book_and_type = defaultdict(lambda: defaultdict(int))
    questions_with_answers = 0
    questions_with_pages = 0
    
    # Analyze each question
    for question in questions:
        q_type = question.get('type', 'unknown')
        book_key = question.get('book_key', 'unknown')
        
        questions_by_type[q_type] += 1
        questions_by_book[book_key] += 1
        questions_by_book_and_type[book_key][q_type] += 1
        
        if 'answer' in question and question['answer']:
            questions_with_answers += 1
        
        if 'page' in question and question['page']:
            questions_with_pages += 1
    
    # Extract division and year from path for display
    path_parts = questions_path.parts
    division_info = ""
    for i, part in enumerate(path_parts):
        if part.startswith("202") and len(part) == 9:  # e.g., "2025-2026"
            if i + 1 < len(path_parts):
                division_info = f" ({path_parts[i]}/{path_parts[i+1]})"
            break
    
    # Print summary
    print("=" * 80)
    print(f"QUESTIONS ANALYSIS: {questions_path.name}{division_info}")
    print(f"File: {questions_path}")
    print("=" * 80)
    
    # Overall statistics
    print(f"\n📊 OVERALL STATISTICS")
    print(f"Total questions: {total_questions:,}")
    print(f"Questions with answers: {questions_with_answers:,} ({questions_with_answers/total_questions*100:.1f}%)")
    print(f"Questions with page numbers: {questions_with_pages:,} ({questions_with_pages/total_questions*100:.1f}%)")
    
    # Questions by type
    print(f"\n📝 QUESTIONS BY TYPE")
    for q_type, count in questions_by_type.most_common():
        percentage = count / total_questions * 100
        print(f"  {q_type}: {count:,} ({percentage:.1f}%)")
    
    # Questions by book (sorted by count)
    print(f"\n📚 QUESTIONS BY BOOK (sorted by count)")
    for book_key, count in questions_by_book.most_common():
        percentage = count / total_questions * 100
        print(f"  {book_key}: {count:,} ({percentage:.1f}%)")
    
    # Average questions per book
    num_books = len(questions_by_book)
    avg_questions = total_questions / num_books if num_books > 0 else 0
    print(f"\nAverage questions per book: {avg_questions:.1f}")
    
    # Detailed breakdown by book and type
    print(f"\n📋 DETAILED BREAKDOWN BY BOOK AND TYPE")
    print(f"{'Book':<40} {'Content':<10} {'In-Which-Book':<15} {'Other':<8} {'Total':<8}")
    print("-" * 85)
    
    for book_key in sorted(questions_by_book_and_type.keys()):
        content_count = questions_by_book_and_type[book_key]['content']
        iwb_count = questions_by_book_and_type[book_key]['in-which-book']
        other_count = questions_by_book[book_key] - content_count - iwb_count
        total_count = questions_by_book[book_key]
        
        # Truncate book name if too long
        display_book = book_key[:37] + "..." if len(book_key) > 40 else book_key
        
        print(f"{display_book:<40} {content_count:<10} {iwb_count:<15} {other_count:<8} {total_count:<8}")
    
    # Books with unusual distributions
    print(f"\n⚠️  BOOKS WITH UNUSUAL DISTRIBUTIONS")
    unusual_books = []
    
    for book_key, counts in questions_by_book_and_type.items():
        content_count = counts['content']
        iwb_count = counts['in-which-book']
        total_count = content_count + iwb_count
        
        # Flag books with very few questions or unusual ratios
        if total_count < avg_questions * 0.5:
            unusual_books.append((book_key, f"Low question count: {total_count}"))
        elif content_count == 0:
            unusual_books.append((book_key, "No content questions"))
        elif iwb_count == 0:
            unusual_books.append((book_key, "No in-which-book questions"))
        elif total_count > 0 and content_count / total_count > 0.8:
            unusual_books.append((book_key, f"High content ratio: {content_count/total_count:.1%}"))
        elif total_count > 0 and iwb_count / total_count > 0.8:
            unusual_books.append((book_key, f"High in-which-book ratio: {iwb_count/total_count:.1%}"))
    
    if unusual_books:
        for book_key, issue in unusual_books:
            print(f"  - {book_key}: {issue}")
    else:
        print("  No unusual distributions found.")
    
    # Summary statistics
    print(f"\n📈 SUMMARY STATISTICS")
    print(f"Number of books: {num_books}")
    if num_books > 0:
        print(f"Min questions per book: {min(questions_by_book.values())}")
        print(f"Max questions per book: {max(questions_by_book.values())}")
        print(f"Median questions per book: {sorted(questions_by_book.values())[num_books//2]}")
    
    return {
        'file_path': str(questions_path),
        'total_questions': total_questions,
        'questions_by_type': dict(questions_by_type),
        'questions_by_book': dict(questions_by_book),
        'questions_by_book_and_type': dict(questions_by_book_and_type),
        'num_books': num_books,
        'avg_questions_per_book': avg_questions,
        'questions_with_answers': questions_with_answers,
        'questions_with_pages': questions_with_pages
    }

def analyze_multiple_files(questions_files):
    """Analyze multiple questions.json files and provide a summary."""
    
    all_results = []
    total_across_all = 0
    
    for questions_file in questions_files:
        print() # Add spacing between files
        result = analyze_questions(questions_file)
        if result:
            all_results.append(result)
            total_across_all += result['total_questions']
    
    if len(all_results) > 1:
        print("\n" + "=" * 80)
        print("SUMMARY ACROSS ALL FILES")
        print("=" * 80)
        
        print(f"\n📊 GRAND TOTALS")
        print(f"Total files analyzed: {len(all_results)}")
        print(f"Total questions across all files: {total_across_all:,}")
        
        # Summary by file
        print(f"\n📁 QUESTIONS BY FILE")
        for result in sorted(all_results, key=lambda x: x['total_questions'], reverse=True):
            file_name = Path(result['file_path']).name
            path_parts = Path(result['file_path']).parts
            
            # Extract division info
            division_info = ""
            for i, part in enumerate(path_parts):
                if part.startswith("202") and len(part) == 9:
                    if i + 1 < len(path_parts):
                        division_info = f" ({path_parts[i]}/{path_parts[i+1]})"
                    break
            
            percentage = result['total_questions'] / total_across_all * 100
            print(f"  {file_name}{division_info}: {result['total_questions']:,} ({percentage:.1f}%)")

def main():
    """Main function to run the analysis."""
    
    if len(sys.argv) > 1:
        # Specific file(s) provided
        questions_files = []
        for arg in sys.argv[1:]:
            if arg == "--all":
                # Find all questions.json files
                found_files = find_questions_files()
                questions_files.extend(found_files)
            elif arg == "--help" or arg == "-h":
                print("Usage:")
                print(f"  python3 {sys.argv[0]}                    # Analyze questions.json in current directory")
                print(f"  python3 {sys.argv[0]} file.json          # Analyze specific file")
                print(f"  python3 {sys.argv[0]} --all              # Analyze all questions.json files in repo")
                print(f"  python3 {sys.argv[0]} file1 file2        # Analyze multiple specific files")
                return
            else:
                questions_files.append(Path(arg))
    else:
        # Default behavior: look for questions.json in current directory
        current_questions = Path("questions.json")
        if current_questions.exists():
            questions_files = [current_questions]
        else:
            # Try to find any questions.json files nearby
            found_files = find_questions_files()
            if found_files:
                print("No questions.json found in current directory.")
                print(f"Found {len(found_files)} questions.json file(s) in repository:")
                for file in found_files:
                    print(f"  {file}")
                print(f"\nRun with --all to analyze all files, or specify a file path.")
                return
            else:
                print("No questions.json files found.")
                print(f"Usage: python3 {sys.argv[0]} [file.json] or --all")
                return
    
    # Remove duplicates and ensure files exist
    valid_files = []
    for file in questions_files:
        file_path = Path(file)
        if file_path.exists():
            if file_path not in valid_files:
                valid_files.append(file_path)
        else:
            print(f"Warning: File '{file}' not found.")
    
    if not valid_files:
        print("No valid questions.json files to analyze.")
        return
    
    # Analyze the files
    if len(valid_files) == 1:
        analyze_questions(valid_files[0])
    else:
        analyze_multiple_files(valid_files)

if __name__ == "__main__":
    main()
