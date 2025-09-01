#!/usr/bin/env python3

import json
import pandas as pd
import os
from pathlib import Path

def main():
    # Get the directory where this script is located
    script_dir = Path(__file__).parent
    
    # Read the bookkey to xlsx mapping
    mapping_file = script_dir / 'bookkey_to_xlsx.json'
    with open(mapping_file, 'r') as f:
        book_mapping = json.load(f)
    
    # Initialize questions list
    all_questions = []
    
    # Process each book
    for book_key, xlsx_filename in book_mapping.items():
        print(f"Processing {book_key}: {xlsx_filename}")
        
        # Path to the Excel file
        xlsx_path = script_dir / '6-8 Questions' / xlsx_filename
        
        if not xlsx_path.exists():
            print(f"Warning: File not found: {xlsx_path}")
            continue
        
        try:
            # Read both sheets from the Excel file
            excel_file = pd.ExcelFile(xlsx_path)
            
            # Process "In Which Book" sheet
            if "In Which Book" in excel_file.sheet_names:
                df_iwb = pd.read_excel(xlsx_path, sheet_name="In Which Book")
                
                for index, row in df_iwb.iterrows():
                    # Skip empty rows
                    if pd.isna(row.get('Unnamed: 1')):
                        continue
                    
                    question_text = str(row['Unnamed: 1']).strip()
                    
                    # Skip if question is empty
                    if not question_text:
                        continue
                    
                    # Create question object
                    question = {
                        "type": "in-which-book",
                        "text": question_text,
                        "book_key": book_key
                    }
                    
                    # Add page number if available
                    if 'Page #' in row and not pd.isna(row['Page #']):
                        try:
                            question["page"] = int(float(row['Page #']))
                        except (ValueError, TypeError):
                            pass
                    
                    all_questions.append(question)
            
            # Process "Content" sheet
            if "Content" in excel_file.sheet_names:
                df_content = pd.read_excel(xlsx_path, sheet_name="Content")
                
                for index, row in df_content.iterrows():
                    # Skip empty rows
                    if pd.isna(row.get('Unnamed: 1')):
                        continue
                    
                    question_text = str(row['Unnamed: 1']).strip()
                    
                    # Skip if question is empty
                    if not question_text:
                        continue
                    
                    # Create question object
                    question = {
                        "type": "content",
                        "text": question_text,
                        "book_key": book_key
                    }
                    
                    # Add answer if available
                    if 'Answer' in row and not pd.isna(row['Answer']):
                        question["answer"] = str(row['Answer']).strip()
                    
                    # Add page number if available
                    if 'Page #' in row and not pd.isna(row['Page #']):
                        try:
                            question["page"] = int(float(row['Page #']))
                        except (ValueError, TypeError):
                            pass
                    
                    all_questions.append(question)
                
        except Exception as e:
            print(f"Error processing {xlsx_filename}: {e}")
            continue
    
    # Create the final JSON structure
    questions_data = {
        "questions": all_questions
    }
    
    # Write to questions.json
    output_file = script_dir / 'questions.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(questions_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nProcessed {len(all_questions)} questions from {len(book_mapping)} books")
    print(f"Output written to: {output_file}")
    
    # Print summary by question type
    content_count = sum(1 for q in all_questions if q["type"] == "content")
    in_which_book_count = sum(1 for q in all_questions if q["type"] == "in-which-book")
    
    print(f"Content questions: {content_count}")
    print(f"In-which-book questions: {in_which_book_count}")

if __name__ == "__main__":
    main()
