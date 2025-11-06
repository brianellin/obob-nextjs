import fs from 'fs/promises';
import path from 'path';
import { Question } from '@/types';

interface RemovalInfo {
  year: string;
  division: string;
  source: string;
  removedIndices: number[];
  removedQuestions: Question[];
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

async function removeDuplicates() {
  const combinations = await getAllYearDivisions();
  const removals: RemovalInfo[] = [];
  let totalRemoved = 0;

  for (const { year, division } of combinations) {
    const sourcesPath = path.join(process.cwd(), 'public', 'obob', year, division, 'sources.json');
    const sourcesContent = await fs.readFile(sourcesPath, 'utf8');
    const { sources } = JSON.parse(sourcesContent) as {
      sources: Array<{ path: string; name: string; link: string | null }>
    };

    for (const source of sources) {
      const questionPath = path.join(process.cwd(), 'public', 'obob', year, division, source.path);
      const questionContent = await fs.readFile(questionPath, 'utf8');
      const data = JSON.parse(questionContent) as { questions: Question[] };
      const { questions } = data;

      const seen = new Map<string, number>();
      const indicesToRemove = new Set<number>();
      const removedQuestions: Question[] = [];

      for (const [index, question] of questions.entries()) {
        const key = `${question.book_key}::${question.text.toLowerCase().trim()}`;

        if (seen.has(key)) {
          // This is a duplicate - mark for removal
          indicesToRemove.add(index);
          removedQuestions.push(question);
        } else {
          seen.set(key, index);
        }
      }

      // If we found duplicates, remove them and write back
      if (indicesToRemove.size > 0) {
        const cleanedQuestions = questions.filter((_, index) => !indicesToRemove.has(index));

        // Write back with pretty formatting
        const updatedData = {
          questions: cleanedQuestions
        };
        await fs.writeFile(questionPath, JSON.stringify(updatedData, null, 2) + '\n', 'utf8');

        removals.push({
          year,
          division,
          source: source.path,
          removedIndices: Array.from(indicesToRemove),
          removedQuestions,
        });

        totalRemoved += indicesToRemove.size;
      }
    }
  }

  return { removals, totalRemoved };
}

async function main() {
  console.log('Starting duplicate removal process...\n');
  console.log('This will remove duplicate questions within the same source file.');
  console.log('(Cross-source duplicates will be preserved)\n');

  const { removals, totalRemoved } = await removeDuplicates();

  if (removals.length === 0) {
    console.log('✅ No within-source duplicates found!');
    return;
  }

  console.log('='.repeat(70));
  console.log('REMOVAL SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total files affected: ${removals.length}`);
  console.log(`Total questions removed: ${totalRemoved}`);
  console.log('='.repeat(70));

  console.log('\n');
  console.log('DETAILED REMOVAL LOG:');
  console.log('-'.repeat(70));

  for (const removal of removals) {
    console.log(`\n${removal.year}/${removal.division}/${removal.source}`);
    console.log(`  Removed ${removal.removedIndices.length} duplicate(s) at indices: [${removal.removedIndices.join(', ')}]`);

    // Show first few removed questions
    const preview = removal.removedQuestions.slice(0, 3);
    preview.forEach((q, i) => {
      const text = q.text.substring(0, 60) + (q.text.length > 60 ? '...' : '');
      console.log(`    [${removal.removedIndices[i]}] ${q.book_key}: "${text}"`);
    });

    if (removal.removedQuestions.length > 3) {
      console.log(`    ... and ${removal.removedQuestions.length - 3} more`);
    }
  }

  console.log('\n');
  console.log('='.repeat(70));
  console.log('✅ DUPLICATE REMOVAL COMPLETE');
  console.log('='.repeat(70));
  console.log('Files have been updated. First occurrences were kept.');
  console.log('Run tests to verify: pnpm run test');
  console.log('='.repeat(70));
}

main().catch(console.error);
