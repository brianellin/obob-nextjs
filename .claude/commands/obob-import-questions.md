# Import Questions from Spreadsheet

Import submitted questions from the Google Sheets spreadsheet into the obobdog_community directories.

## Instructions

The user will paste tab-separated data from the submitted questions spreadsheet with these columns:
`year	division	bookKey	questionType	page	questionText	answer	sourceName	sourceLink	sourceEmail`

Parse the pasted data and for each row:

1. **Parse the contributor name**: Extract first name and last initial from `sourceName` (e.g., "John Smith" becomes "John S.")

2. **Create the question object**:
   - For `questionType` = "content":
     ```json
     {
       "type": "content",
       "text": "<questionText>",
       "answer": "<answer>",
       "book_key": "<bookKey>",
       "page": <page as number>,
       "contributor": "<FirstName L.>"
     }
     ```
   - For `questionType` = "in-which-book":
     ```json
     {
       "type": "in-which-book",
       "text": "<questionText>",
       "book_key": "<bookKey>",
       "page": <page as number>,
       "contributor": "<FirstName L.>"
     }
     ```

3. **Locate or create the target file**: `public/obob/<year>/<division>/obobdog_community/questions.json`

4. **If the obobdog_community directory doesn't exist**:
   - Create the directory
   - Create `questions.json` with `{"questions": []}`
   - Update `sources.json` in the parent directory to add:
     ```json
     {
       "path": "obobdog_community/questions.json",
       "name": "OBOB.dog Community",
       "link": "/blog/obob-dog-community"
     }
     ```

5. **Add the questions**: Append the new questions to the existing questions array (avoid duplicates by checking if a question with the same text and book_key already exists)

6. **Validate**: Ensure the bookKey exists in the corresponding `books.json` file

7. **Report**: Show a summary of questions added per year/division

## Data to import

$ARGUMENTS
