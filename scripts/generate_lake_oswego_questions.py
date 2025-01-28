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
    book_pattern = rf'{books[book_key]["title"]} by {books[book_key]["author"]} \(p\. \d+.*?\)'
    cleaned = re.sub(book_pattern, '', answer)
    # Remove any remaining page references
    cleaned = re.sub(r'\(p\. \d+.*?\)', '', cleaned)
    # Clean up any leftover parentheses and extra spaces
    cleaned = re.sub(r'\s+', ' ', cleaned).strip(' ,()')
    return cleaned

# Load books data
with open('public/obob/2024-2025/6-8/books.json', 'r') as f:
    books_data = json.load(f)
    books = books_data['books']

questions = []
csv_dir = 'public/obob/2024-2025/6-8/lake-oswego'

# Process each CSV file
for filename in os.listdir(csv_dir):
    if not filename.endswith('.csv'):
        continue
        
    book_key = filename[:-4]  # Remove .csv extension
    
    with open(os.path.join(csv_dir, filename), 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            question = row['Question']
            answer = row['Answer']
            
            question_type = determine_question_type(question)
            page = extract_page_number(answer)
            
            # For content questions, clean up the question text
            if question_type == 'content':
                # Remove the book reference from the start of the question
                book_prefix = f"In {books[book_key]['title']} by {books[book_key]['author']}, "
                if question.startswith(book_prefix):
                    question = question[len(book_prefix):]
                answer = clean_answer(answer, book_key)
            
            question_obj = {
                "type": question_type,
                "text": question,
                "book_key": book_key,
                "answer": answer
            }
            
            if page:
                question_obj["page"] = page
                
            # Check for two-part answers
            if " and " in answer or "," in answer or "Any two:" in answer:
                question_obj["two_part"] = True
                
            questions.append(question_obj)

# Write the output file
output = {"questions": questions}
output_path = os.path.join(csv_dir, 'questions.json')
with open(output_path, 'w') as f:
    json.dump(output, f, indent=2)

print(f"Generated {len(questions)} questions in {output_path}") 