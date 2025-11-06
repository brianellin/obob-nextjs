import fs from 'fs/promises';
import path from 'path';
import { Question } from '@/types';

interface DuplicateInfo {
  text: string;
  book_key: string;
  answer?: string;
  page?: number;
  occurrences: Array<{
    year: string;
    division: string;
    source: string;
    index: number;
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

async function analyzeDuplicates() {
  const combinations = await getAllYearDivisions();
  const allDuplicates: Map<string, DuplicateInfo> = new Map();

  for (const { year, division } of combinations) {
    const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
    const sourcesContent = await fs.readFile(sourcesPath, 'utf8');
    const { sources } = JSON.parse(sourcesContent) as {
      sources: Array<{ path: string; name: string; link: string | null }>
    };

    const seen = new Map<string, { source: string; index: number }>();
    const yearDivKey = `${year}/${division}`;

    for (const source of sources) {
      const questionPath = path.join(process.cwd(), 'public', 'obob', year, division, source.path);
      const questionContent = await fs.readFile(questionPath, 'utf8');
      const { questions } = JSON.parse(questionContent) as { questions: Question[] };

      for (const [index, question] of questions.entries()) {
        const key = `${question.book_key}::${question.text.toLowerCase().trim()}`;
        const globalKey = `${yearDivKey}::${key}`;

        if (seen.has(key)) {
          // This is a duplicate
          const first = seen.get(key)!;

          if (!allDuplicates.has(globalKey)) {
            allDuplicates.set(globalKey, {
              text: question.text,
              book_key: question.book_key,
              answer: (question as any).answer,
              page: question.page,
              occurrences: [
                {
                  year,
                  division,
                  source: first.source,
                  index: first.index,
                }
              ]
            });
          }

          allDuplicates.get(globalKey)!.occurrences.push({
            year,
            division,
            source: source.path,
            index,
          });
        } else {
          seen.set(key, { source: source.path, index });
        }
      }
    }
  }

  return Array.from(allDuplicates.values());
}

async function main() {
  console.log('Analyzing duplicate questions...\n');

  const duplicates = await analyzeDuplicates();

  // Group by pattern
  const withinSource = duplicates.filter(d => {
    const uniqueSources = new Set(d.occurrences.map(o => o.source));
    return uniqueSources.size === 1;
  });

  const acrossSources = duplicates.filter(d => {
    const uniqueSources = new Set(d.occurrences.map(o => o.source));
    return uniqueSources.size > 1;
  });

  console.log('='.repeat(70));
  console.log('DUPLICATE ANALYSIS');
  console.log('='.repeat(70));
  console.log(`Total duplicate questions: ${duplicates.length}`);
  console.log(`Within same source: ${withinSource.length}`);
  console.log(`Across different sources: ${acrossSources.length}`);
  console.log('='.repeat(70));

  // Show examples of within-source duplicates
  console.log('\n');
  console.log('DUPLICATES WITHIN SAME SOURCE (first 5):');
  console.log('-'.repeat(70));
  withinSource.slice(0, 5).forEach(dup => {
    console.log(`\nBook: ${dup.book_key}`);
    console.log(`Text: ${dup.text.substring(0, 80)}${dup.text.length > 80 ? '...' : ''}`);
    console.log(`Source: ${dup.occurrences[0].source}`);
    console.log(`Indices: [${dup.occurrences.map(o => o.index).join(', ')}]`);
    console.log(`Count: ${dup.occurrences.length} times`);
  });

  // Show examples of across-source duplicates
  console.log('\n\n');
  console.log('DUPLICATES ACROSS DIFFERENT SOURCES (first 5):');
  console.log('-'.repeat(70));
  acrossSources.slice(0, 5).forEach(dup => {
    console.log(`\nBook: ${dup.book_key}`);
    console.log(`Text: ${dup.text.substring(0, 80)}${dup.text.length > 80 ? '...' : ''}`);
    console.log(`Sources:`);
    dup.occurrences.forEach(o => {
      console.log(`  - ${o.source}[${o.index}]`);
    });
    console.log(`Count: ${dup.occurrences.length} times`);
  });

  // Group by year/division
  console.log('\n\n');
  console.log('DUPLICATES BY YEAR/DIVISION:');
  console.log('-'.repeat(70));

  const byYearDiv = new Map<string, number>();
  duplicates.forEach(dup => {
    const key = `${dup.occurrences[0].year}/${dup.occurrences[0].division}`;
    byYearDiv.set(key, (byYearDiv.get(key) || 0) + 1);
  });

  Array.from(byYearDiv.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([key, count]) => {
      console.log(`${key}: ${count} duplicate questions`);
    });

  // Summary
  console.log('\n');
  console.log('='.repeat(70));
  console.log('RECOMMENDATIONS');
  console.log('='.repeat(70));
  console.log('1. Within-source duplicates should probably be removed');
  console.log('   (Same source has exact same question multiple times)');
  console.log('');
  console.log('2. Cross-source duplicates may be intentional');
  console.log('   (Different libraries independently created similar questions)');
  console.log('   Consider if you want to keep variety or deduplicate');
  console.log('='.repeat(70));
}

main().catch(console.error);
