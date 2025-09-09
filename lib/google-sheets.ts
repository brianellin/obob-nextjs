import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// Generic function to append data to any Google Sheet  
async function appendToSheet(sheetId: string, data: Record<string, string | number>) {
  try {
    const SCOPES = [
      'https://www.googleapis.com/auth/spreadsheets',
    ];

    const jwt = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: SCOPES,
    });

    const doc = new GoogleSpreadsheet(sheetId, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow(data);
    console.log('Successfully added data to Google Sheet');
  } catch (error) {
    console.error('Error appending to Google Sheets:', error);
    throw error;
  }
}

export async function appendFeedbackToSheet(feedbackData: {
  timestamp: string;
  status: string;
  feedback: string;
  year: string;
  division: string;
  book: {
    title: string;
    author: string;
    book_key: string;
  };
  question: {
    type: string;
    text: string;
    page: number;
    answer?: string;
  };
  source?: {
    name: string;
    link?: string;
  };
}) {
  const rowData = {
    timestamp: feedbackData.timestamp,
    status: feedbackData.status,
    feedback: feedbackData.feedback,
    year: feedbackData.year,
    division: feedbackData.division,
    bookTitle: feedbackData.book.title,
    bookAuthor: feedbackData.book.author,
    bookKey: feedbackData.book.book_key,
    questionType: feedbackData.question.type,
    questionText: feedbackData.question.text,
    page: feedbackData.question.page,
    answer: feedbackData.question.answer || '',
    sourceName: feedbackData.source?.name || '',
    sourceLink: feedbackData.source?.link || '',
  };

  return appendToSheet(process.env.GOOGLE_FEEDBACK_SHEET_ID!, rowData);
}

export async function appendQuestionToSheet(questionData: {
  timestamp: string;
  status: string;
  year: string;
  division: string;
  bookKey: string;
  questionType: string;
  questionText: string;
  page: number;
  answer?: string;
  sourceName: string;
  sourceLink?: string;
  sourceEmail: string;
}) {
  const rowData = {
    timestamp: questionData.timestamp,
    status: questionData.status,
    year: questionData.year,
    division: questionData.division,
    bookKey: questionData.bookKey,
    questionType: questionData.questionType,
    questionText: questionData.questionText,
    page: questionData.page,
    answer: questionData.answer || '',
    sourceName: questionData.sourceName,
    sourceLink: questionData.sourceLink || '',
    sourceEmail: questionData.sourceEmail,
  };

  return appendToSheet(process.env.GOOGLE_QUESTION_SHEET_ID!, rowData);
}

// Helper function to set up headers for the Google Sheet (run this once)
export async function setupFeedbackSheetHeaders() {
  try {
    const SCOPES = [
      'https://www.googleapis.com/auth/spreadsheets',
    ];

    const jwt = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: SCOPES,
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_FEEDBACK_SHEET_ID!, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    // Set header row
    await sheet.setHeaderRow([
      'timestamp',
      'feedback', 
      'year',
      'division',
      'bookTitle',
      'bookAuthor', 
      'bookKey',
      'questionType',
      'questionText',
      'page',
      'answer',
      'sourceName',
      'sourceLink'
    ]);

    console.log('Headers set up successfully!');
  } catch (error) {
    console.error('Error setting up headers:', error);
    throw error;
  }
}
