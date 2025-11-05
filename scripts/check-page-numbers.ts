import fs from 'fs/promises';
import path from 'path';
import { Question } from '@/types';

interface PageStats {
  totalQuestions: number;
  missingPage: number;
  invalidPage: number;
  pageZero: number;
  validPage: number;
  missingPageQuestions: Array<{
    year: string;
    division: string;
    source: string;
    index: number;
    question: Question;
  }>;
}

async function getAllYearDivisions(): Promise<Array<{ year: string; division: string }>> {
  const obobPath = path.join(process.cwd(), 'public', 'obob');
  const years = await fs.readdir(obobPath);

  const combinations: Array<{ year: string; division: string }> = [];

  for (const year of years) {
    if (year.startsWith('.')) continue;
    const yearPath = path.join(obobPath, year);
    const stat = await fs.stat(yearPath);

    if (stat.isDirectory()) {
      const divisions = await fs.readdir(yearPath);
      for (const division of divisions) {
        if (division.startsWith('.')) continue;
        const divisionPath = path.join(yearPath, division);
        const divStat = await fs.stat(divisionPath);
        if (divStat.isDirectory()) {
          combinations.push({ year, division });
        }
      }
    }
  }

  return combinations;
}

async function checkPageNumbers() {
  const stats: PageStats = {
    totalQuestions: 0,
    missingPage: 0,
    invalidPage: 0,
    pageZero: 0,
    validPage: 0,
    missingPageQuestions: [],
  };

  const combinations = await getAllYearDivisions();

  for (const { year, division } of combinations) {
    const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
    const sourcesContent = await fs.readFile(sourcesPath, 'utf8');
    const { sources } = JSON.parse(sourcesContent) as {
      sources: Array<{ path: string; name: string; link: string | null }>
    };

    for (const source of sources) {
      const questionPath = path.join(process.cwd(), 'public', 'obob', year, division, source.path);
      const questionContent = await fs.readFile(questionPath, 'utf8');
      const { questions } = JSON.parse(questionContent) as { questions: Question[] };

      for (const [index, question] of questions.entries()) {
        stats.totalQuestions++;

        if (question.page === undefined || question.page === null) {
          stats.missingPage++;
          stats.missingPageQuestions.push({
            year,
            division,
            source: source.path,
            index,
            question,
          });
        } else if (typeof question.page !== 'number') {
          stats.invalidPage++;
          stats.missingPageQuestions.push({
            year,
            division,
            source: source.path,
            index,
            question,
          });
        } else if (question.page === 0) {
          stats.pageZero++;
        } else if (question.page > 0) {
          stats.validPage++;
        } else {
          stats.invalidPage++;
          stats.missingPageQuestions.push({
            year,
            division,
            source: source.path,
            index,
            question,
          });
        }
      }
    }
  }

  return stats;
}

async function main() {
  console.log('Analyzing page numbers in OBOB questions...\n');

  const stats = await checkPageNumbers();

  console.log('='.repeat(70));
  console.log('PAGE NUMBER STATISTICS');
  console.log('='.repeat(70));
  console.log(`Total Questions:        ${stats.totalQuestions}`);
  console.log(`Valid Page Numbers:     ${stats.validPage} (${((stats.validPage / stats.totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`Page Zero:              ${stats.pageZero} (${((stats.pageZero / stats.totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`Missing Page:           ${stats.missingPage} (${((stats.missingPage / stats.totalQuestions) * 100).toFixed(1)}%)`);
  console.log(`Invalid Page:           ${stats.invalidPage} (${((stats.invalidPage / stats.totalQuestions) * 100).toFixed(1)}%)`);
  console.log('='.repeat(70));

  if (stats.missingPageQuestions.length > 0) {
    console.log('\n');
    console.log('QUESTIONS WITH MISSING OR INVALID PAGE NUMBERS:');
    console.log('-'.repeat(70));

    for (const item of stats.missingPageQuestions) {
      const pageValue = item.question.page === undefined ? 'undefined' :
                       item.question.page === null ? 'null' :
                       `${item.question.page} (type: ${typeof item.question.page})`;

      console.log(`\nLocation: ${item.year}/${item.division}/${item.source}[${item.index}]`);
      console.log(`Book:     ${item.question.book_key}`);
      console.log(`Type:     ${item.question.type}`);
      console.log(`Page:     ${pageValue}`);
      console.log(`Text:     ${item.question.text.substring(0, 80)}${item.question.text.length > 80 ? '...' : ''}`);
    }
  }

  // Summary
  console.log('\n');
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  if (stats.missingPage === 0 && stats.invalidPage === 0) {
    console.log('✓ All questions have page numbers!');
    if (stats.pageZero > 0) {
      console.log(`⚠ Note: ${stats.pageZero} question(s) have page number 0`);
    }
  } else {
    console.log(`✗ ${stats.missingPage + stats.invalidPage} question(s) need page numbers fixed`);
  }
  console.log('='.repeat(70));
}

main().catch(console.error);
