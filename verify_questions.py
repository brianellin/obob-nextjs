import json
from pathlib import Path

# Define question sources
QUESTION_SOURCES = [
    'public/obob/lake_oswego/questions.json',
    'public/obob/cedar_mill/questions.json',
    'public/obob/glencoe/glencoe_questions.json',
]

def main():
    # Load books
    with open('public/obob/books.json', 'r') as f:
        books = json.load(f)['books']
    
    # Load and check all questions
    invalid_questions = []
    
    for source in QUESTION_SOURCES:
        try:
            with open(source, 'r') as f:
                questions = json.load(f)['questions']
                
            for q in questions:
                if q['book_key'] not in books:
                    invalid_questions.append({
                        'source': source,
                        'question': q['question'],
                        'invalid_book_key': q['book_key']
                    })
        except Exception as e:
            print(f"Error processing {source}: {str(e)}")
    
    # Print results
    if invalid_questions:
        print("\nFound questions with invalid book keys:")
        for q in invalid_questions:
            print(f"\nSource: {q['source']}")
            print(f"Question: {q['question']}")
            print(f"Invalid book_key: {q['invalid_book_key']}")
        print(f"\nTotal invalid questions: {len(invalid_questions)}")
    else:
        print("\nAll questions have valid book keys! 🎉")
    
    # Print total questions processed
    total_questions = sum(len(json.load(open(src))['questions']) for src in QUESTION_SOURCES)
    print(f"\nTotal questions processed: {total_questions}")

if __name__ == "__main__":
    main()