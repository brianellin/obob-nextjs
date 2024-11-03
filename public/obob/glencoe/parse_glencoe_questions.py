import csv
import json
import os
from pathlib import Path

def _check_if_two_part(text):
    """Helper function to check if a question is two-part and clean the text.
    Returns (cleaned_text, is_two_part)"""
    # Base indicators without punctuation
    base_indicators = [
        "[TWO PART QUESTION]",
        "[Two-Part Question]",
        "[Two Part Question]",
        "[2 part question]",
        "[Two Part]",
        "(2 PARTS)",
        "(Two part)",
        "(Two-part)",
        "(TWO PART)",
        "TWO PART QUESTION",
        "Two-Part Question",
        "Two Part Question",
        "Two Parts",
        "Two - Part Question"
    ]
    
    # Create variations with different punctuation
    two_part_indicators = []
    for indicator in base_indicators:
        two_part_indicators.append(indicator)
        two_part_indicators.append(indicator + ":")
        two_part_indicators.append(indicator + ";")
    
    is_two_part = False
    cleaned_text = text.strip()
    
    # Check for indicators only at the start of the text
    text_lower = cleaned_text.lower()
    for indicator in two_part_indicators:
        if text_lower.startswith(indicator.lower()):
            is_two_part = True
            # Remove the indicator from the start
            cleaned_text = cleaned_text[len(indicator):].strip()
            # Remove any leading punctuation that might remain
            cleaned_text = cleaned_text.lstrip(':;').strip()
            break
    
    return cleaned_text, is_two_part

def clean_iwb_question(text, book_title):
    """Clean 'In which book' type questions."""
    had_question_mark = text.strip().endswith('?')
    
    # First remove any two-part indicators
    text, is_two_part = _check_if_two_part(text)
    
    # Remove the "In which book" prefix and everything before the relevant part
    text = text.strip()
    text_lower = text.lower()
    
    if text_lower.startswith('in which book'):
        text = text[len('in which book'):].strip()
        text = text.lstrip('.')
        text = text.strip()
    elif text_lower.startswith('iwb'):
        text = text[len('iwb'):].strip()
        text = text.lstrip('.')
        text = text.strip()

    # Only add question mark if original text had one
    text = text.strip('?').strip()
    if had_question_mark:
        text += "?"
    
    return text, is_two_part

def clean_content_question(text, book_title):
    """Clean content questions that might start with book references."""
    had_question_mark = text.strip().endswith('?')
    
    # First remove any two-part indicators
    text, is_two_part = _check_if_two_part(text)
    
    text = text.strip()
    text_lower = text.lower()
    
    # Handle "In BookTitle, ..." pattern
    if text_lower.startswith('in'):
        book_title_lower = book_title.lower()
        possible_starts = [
            f"in the book, {book_title_lower}",
            f"in the book {book_title_lower}",
            f"in {book_title_lower}",
        ]            
        
        for start in possible_starts:
            if text.lower().startswith(start):
                rest = text[len(start):].strip()
                if rest.startswith(','):
                    text = rest[1:].strip()
                else:
                    text = rest
                break
        else:
            print(f"No start found for {text.lower()} - {book_title_lower}\n")
    else:
        print(f"Content q doesn't start with In: {text}")
    
    # Only add question mark if original text had one
    text = text.strip('?').strip()
    if had_question_mark:
        text += "?"
    
    return text, is_two_part

def get_book_title(book_key, books_data):
    try:
        with open(Path(__file__).parent.parent / 'books.json', 'r', encoding='utf-8') as f:
            data = json.load(f)
            return data['books'].get(book_key, {}).get('title', '')
    except Exception as e:
        print(f"Error loading books.json: {str(e)}")
        return ''

def parse_csv_file(file_path, question_type, book_key):
    questions = []
    book_title = get_book_title(book_key, None)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                # Skip empty rows or rows without questions
                if not row or all(not value for value in row.values()):
                    continue
                
                if question_type == "content":
                    # Get the first key which should be the question column
                    question_key = next(key for key in row.keys() if 'Question' in key)
                    question = row[question_key]
                    page = row.get('Page #', '').strip().split(',')[0]  # Take first page if multiple
                    answer = row.get('Answer', '')
                    
                    if question and answer:  # Only add if both question and answer exist
                        cleaned_text, is_two_part = clean_content_question(question, book_title)
                        question_obj = {
                            "type": "content",
                            "text": cleaned_text,
                            "book_key": book_key,
                            "answer": answer.strip(),
                            "page": int(page) if page.isdigit() else 0
                        }
                        if is_two_part:
                            question_obj["two_part"] = True
                        questions.append(question_obj)
                        
                elif question_type == "in-which-book":
                    # Get the first key which should be the question column
                    question_key = next(key for key in row.keys() if 'Question' in key)
                    question = row[question_key]
                    page = row.get('Page #', '').strip().split(',')[0]  # Take first page if multiple
                    
                    if question and page:  # Only add if both question and page exist
                        cleaned_text, is_two_part = clean_iwb_question(question, book_title)
                        question_obj = {
                            "type": "in-which-book",
                            "text": cleaned_text,
                            "book_key": book_key,
                            "page": int(page) if page.isdigit() else 0
                        }
                        if is_two_part:
                            question_obj["two_part"] = True
                        questions.append(question_obj)
                        
    except FileNotFoundError:
        print(f"File not found: {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        
    return questions

def main():
    base_dir = Path(__file__).parent
    all_questions = []
    
    # Iterate through all subdirectories
    for folder in base_dir.iterdir():
        if folder.is_dir():
            book_key = folder.name
            
            # Process content questions
            content_file = folder / "content.csv"
            content_questions = parse_csv_file(content_file, "content", book_key)
            all_questions.extend(content_questions)
            
            # Process in-which-book questions
            iwb_file = folder / "iwb.csv"
            iwb_questions = parse_csv_file(iwb_file, "in-which-book", book_key)
            all_questions.extend(iwb_questions)
    
    # Write to JSON file
    output = {"questions": all_questions}
    output_file = base_dir / "glencoe_questions.json"
    
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully processed {len(all_questions)} questions")

if __name__ == "__main__":
    main()
