import json
import re

def extract_page_number(answer):
    # Extract page number from the answer text
    page_match = re.search(r'\(p\. (\d+)\)', answer)
    if page_match:
        return int(page_match.group(1))
    return None

def clean_answer(answer):
    # Remove page references and clean up
    cleaned = re.sub(r'\s*\(p\.\s*\d+\)', '', answer)
    # Remove the 'a.' prefix if it exists
    cleaned = re.sub(r'^a\.\s*', '', cleaned)
    # Clean up any extra spaces
    cleaned = cleaned.strip()
    return cleaned

def parse_raw_questions(content):
    questions = []
    current_type = None
    book_key = "candidly-cline"  # Since all questions are from this book
    
    lines = content.split('\n')
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines and headers
        if not line or "These questions were developed" in line or line.startswith("Candidly Cline by"):
            i += 1
            continue
            
        # Detect section type
        if line == "Content Questions":
            current_type = "content"
            i += 1
            continue
        elif line == "In Which Book Questions:":
            current_type = "in-which-book"
            i += 1
            continue
            
        # Parse question
        if line and (line.startswith(str(len(questions) + 1) + ".") or line.startswith("In which book")):
            question_text = line
            # For numbered questions, remove the number prefix
            if current_type == "content":
                question_text = re.sub(r'^\d+\.\s*', '', question_text)
                # Remove book reference from content questions
                question_text = re.sub(r'^In Candidly Cline,\s*', '', question_text)
            
            # Get answer from next line
            i += 1
            while i < len(lines) and not lines[i].strip().startswith('a.'):
                i += 1
            if i < len(lines):
                answer = lines[i].strip()
                
                # Create question object
                question_obj = {
                    "type": current_type,
                    "text": question_text,
                    "book_key": book_key
                }
                
                # Extract and add page number
                page = extract_page_number(answer)
                if page:
                    question_obj["page"] = page
                
                # Only include answer for content questions
                if current_type == "content":
                    answer = clean_answer(answer)
                    question_obj["answer"] = answer
                    # Check for two-part answers
                    if " and " in answer or "," in answer:
                        question_obj["two_part"] = True
                
                questions.append(question_obj)
        
        i += 1
    
    return questions

# Read the raw questions file
with open('raw_questions.txt', 'r') as f:
    content = f.read()

# Parse questions
questions = parse_raw_questions(content)

# Write the output file
output = {"questions": questions}
with open('questions.json', 'w') as f:
    json.dump(output, f, indent=2)

print(f"Generated {len(questions)} questions in questions.json") 