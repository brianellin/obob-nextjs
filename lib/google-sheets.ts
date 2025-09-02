import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

export async function appendFeedbackToSheet(feedbackData: {
  timestamp: string;
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
  try {
    const SCOPES = [
      'https://www.googleapis.com/auth/spreadsheets',
    ];

    const jwt = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: SCOPES,
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];

    await sheet.addRow({
      timestamp: feedbackData.timestamp,
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
    });

    console.log('Successfully added feedback to Google Sheet');
  } catch (error) {
    console.error('Error appending to Google Sheets:', error);
    throw error;
  }
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

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID!, jwt);
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
