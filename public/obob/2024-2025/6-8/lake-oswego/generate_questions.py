import csv
import json
import os
import re

def extract_page_number(answer):
    # Extract page number from the answer text
    page_match = re.search(r'\(p\. (\d+)', answer)
    if page_match:
        return int(page_match.group(1))
    return None

def determine_question_type(question):
    # If question starts with "In which book", it's an in-which-book question
    if question.lower().startswith('in which book'):
        return 'in-which-book'
    return 'content'

def clean_answer(answer, book_key):
    # Remove book reference and page numbers for content questions
    book_pattern = rf'{books[book_key]["title"]} by {books[book_key]["author"]}'
    cleaned = re.sub(book_pattern, '', answer)
    # Remove any page references
    cleaned = re.sub(r'\s*\(p\.\s*\d+[^)]*\)', '', cleaned)
    # Clean up any leftover parentheses and extra spaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip(' ,()')
    return cleaned

def clean_question_text(question, question_type, book_key):
    if question_type == 'in-which-book':
        # Remove "In which book" prefix and clean up
        cleaned = re.sub(r'^in which book\s+', '', question.lower())
        return cleaned
    elif question_type == 'content':
        # Remove book reference prefix for content questions
        book_prefix = f"In {books[book_key]['title']} by {books[book_key]['author']}, "
        if question.startswith(book_prefix):
            return question[len(book_prefix):]
    return question

# Load books data
with open('../books.json', 'r') as f:
    books_data = json.load(f)
    books = books_data['books']

questions = []

# Process each CSV file in current directory
for filename in os.listdir('.'):
    if not filename.endswith('.csv'):
        continue
        
    book_key = filename[:-4]  # Remove .csv extension
    
    with open(filename, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            question = row['Question']
            answer = row['Answer']
            
            question_type = determine_question_type(question)
            page = extract_page_number(answer)
            
            # Clean up question text based on type
            question = clean_question_text(question, question_type, book_key)
            
            # Create question object with common fields
            question_obj = {
                "type": question_type,
                "text": question,
                "book_key": book_key
            }
            
            # Only include answer for content questions
            if question_type == 'content':
                answer = clean_answer(answer, book_key)
                question_obj["answer"] = answer
                # Check for two-part answers
                if " and " in answer or "," in answer or "Any two:" in answer:
                    question_obj["two_part"] = True
            
            if page:
                question_obj["page"] = page
                
            questions.append(question_obj)

# Write the output file
output = {"questions": questions}
with open('questions.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"Generated {len(questions)} questions in questions.json") 