import os
import json
import re

def extract_book_key(filename):
    return os.path.splitext(filename)[0]

def parse_txt_file(filepath):
    questions = []
    current_question = None
    
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line.startswith('QUESTION'):
            if current_question:
                questions.append(current_question)
            current_question = {'type': 'content'}
            # Extract question text after the number
            match = re.match(r'QUESTION \d+:\s*(.*)', line)
            if match:
                current_question['text'] = match.group(1).strip()
                
        elif line.startswith('ANSWER:'):
            if current_question:
                answer = line.replace('ANSWER:', '').strip()
                current_question['answer'] = answer
                # Check if it's a two-part answer
                if ' and ' in answer:
                    current_question['two_part'] = True
                
        elif line.startswith('PAGE:'):
            if current_question:
                # Extract only the first number if multiple are present
                page_text = line.replace('PAGE:', '').strip()
                page_number = re.search(r'\d+', page_text)
                if page_number:
                    current_question['page'] = int(page_number.group())
    
    if current_question:
        questions.append(current_question)
        
    return questions

def main():
    # Load books.json for book keys
    with open('../books.json', 'r') as f:
        books_data = json.load(f)
        book_keys = {book['title'].lower(): key for key, book in books_data['books'].items()}
    
    all_questions = []
    total_questions = 0
    
    # Process each txt file
    for filename in sorted(os.listdir('.')):
        if filename.endswith('.txt'):
            book_key = extract_book_key(filename)
            questions = parse_txt_file(filename)
            
            # Add book_key to each question
            for question in questions:
                question['book_key'] = book_key
            
            num_questions = len(questions)
            total_questions += num_questions
            print(f"Found {num_questions} questions in {filename}")
            
            all_questions.extend(questions)
    
    print(f"\nTotal questions processed: {total_questions}")
    
    # Create output JSON
    output = {'questions': all_questions}
    
    # Write to questions.new.json
    with open('questions.new.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2, ensure_ascii=False)
    
    print(f"\nQuestions have been written to questions.new.json")

if __name__ == '__main__':
    main() 