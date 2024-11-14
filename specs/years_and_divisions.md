# Adding years and divisions to OBOB.dog quizes

Background:

- This next.js app runs on obob.dog, and is used by kids and teaches to practice Oregon Battle of the Books battles.
- Each year there is a new season of OBOB, with different books and questions for those books.
- There are three divisions - elementary, middle, and high school. Elementary is grades 3-5, middle is grades 6-8, and high school is grades 9-12.
- Each division has a set of books that are appropriate for age group and reading level.
- The current iteration of the app is built around the 2024-2025 season, with books and questions only for the elementary (3-5) division.
- Questions are currently stored in a JSON file, and are not associated with any particular year or division.
- Queestion are stored by source, and then combined at runtime to generate the battles.
- There is typically a bit of pre-processing of the questions from from CSV or TXT sources to get them into the json format used by the app.
- We want to keep the app static, and use flat JSON files instead of introducing unnecessary dependecies like a database.

## Goals

- Make the app scale to future years and divisions.
- We should be able to store books by year and division, and questions by source and book.
- The app URL structure should be updated to reflect the year and division. for example, the 2024-2025 season should be accessible at obob.dog/2024-2025, and the elementary division should be accessible at obob.dog/2024-2025/elementary.
- The file structure should be updated to reflect the year and division. for example, the 2024-2025 season should have its own directory, and the elementary division should have its own directory inside that. Each division directory should contain the books.json file, which lists the books for that division, and the questions directory, which contains the questions for that division. Questions should be stored by source file, and then combined at runtime to generate the battles.
- We should be able to add new questions to the app by adding new source files to the questions directory.
- Book covers should be stored in the public directory, and referenced in the books.json file.
- the json files should not be in the public directory, because they are generated at runtime by the app calling into the /api/questions endpoint.

## Tasks

1. Come up with a file structure for storing the years, disvisions, books, sources, and questionsgiven the goals above. Document the file structure in the section below.
2. Update the app to use the new file structure.
3. Update the generation of questions at runtime to use the new file structure.
4. Update the /books page to use the new file structure.
5. Add a middle school division for the 2024-2025 season, with the appropriate books and questions.

## File structure
