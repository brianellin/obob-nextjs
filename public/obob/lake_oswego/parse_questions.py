import json
import re

def load_books():
    with open('../books.json', 'r') as f:
        books_data = json.load(f)
    
    # Create a mapping of book title+author to book_key
    title_to_key = {}
    for key, book in books_data['books'].items():
        title_author = f"{book['title']} by {book['author']}"
        title_to_key[title_author] = key
    return title_to_key

def parse_questions(input_text, title_to_key):
    questions = []
    lines = input_text.split('\n')
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty lines
        if not line:
            i += 1
            continue
            
        # Check for "In which book" questions
        if line.startswith("In which book"):
            question = line[len("In which book"):].strip()
            if True: #question.startswith("does"):
                #question = question.rstrip('?')
                
                # Get answer from next line
                i += 1
                while i < len(lines) and not lines[i].strip().startswith("Answer:"):
                    i += 1
                    
                if i < len(lines):
                    answer_line = lines[i].strip()
                    answer_match = re.match(r"Answer: (.*?) by (.*?) \(p\. (-?\d+)\)", answer_line)
                    if answer_match:
                        book_title = f"{answer_match.group(1)} by {answer_match.group(2)}"
                        page = answer_match.group(3)
                        
                        if book_title in title_to_key:
                            questions.append({
                                "type": "in-which-book",
                                "text": question,
                                "book_key": title_to_key[book_title],
                                "page": int(page)
                            })
                        else:
                            print(f"No book key, skipping: {book_title}")
                    else:
                        print(f"No match, skipping: {answer_line}")
            else:
                print(f"Skipping in which book without does: {line}")

        # Check for content questions
        elif line.startswith("In "):
            match = re.match(r"In (.*?) by (.*?), (.*?[\?\.])", line)
            if match:
                book_title = f"{match.group(1)} by {match.group(2)}"
                question = match.group(3)
                
                # Get answer from next line
                i += 1
                while i < len(lines) and not lines[i].strip().startswith("Answer:"):
                    i += 1
                    
                if i < len(lines):
                    answer_line = lines[i].strip()
                    answer_match = re.match(r"Answer: (.*?) \(p\. (\d+)\)", answer_line)
                    if answer_match:
                        answer = answer_match.group(1)
                        page = answer_match.group(2)
                        
                        if book_title in title_to_key:
                            questions.append({
                                "type": "content",
                                "text": question,
                                "book_key": title_to_key[book_title],
                                "answer": answer,
                                "page": int(page)
                            })
                        else:
                            print(f"No book key, skipping: {book_title}")
                    else:
                        print(f"No match, skipping: {answer_line}")
            else:
                print(f"No In match: {line}")       
        else:
            print(f"Skipping: {line}")

        i += 1
    
    return questions

def main():
    # Load book mappings
    title_to_key = load_books()
    
    # Read input file
    with open('lake_oswego_questions.txt', 'r') as f:
        input_text = f.read()
    
    # Parse questions
    questions = parse_questions(input_text, title_to_key)
    
    # Write output JSON
    output = {"questions": questions,
              "source": {
                  "name": "Lake Oswego Public Library",
                  "link": "https://www.ci.oswego.or.us/kids/obob-practice-questions"
              }}
    with open('lake_oswego_questions.json', 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"Processed {len(questions)} questions")

if __name__ == "__main__":
    main()