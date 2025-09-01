# OBOB Scripts

This directory contains utility scripts for analyzing and managing OBOB (Oregon Battle of the Books) question data.

## Available Scripts

### `analyze_questions.py`

A comprehensive analysis tool for questions.json files that provides detailed statistics and insights.

#### Features

- **Overall Statistics**: Total questions, questions with answers, questions with page numbers
- **Question Type Breakdown**: Content vs In-which-book questions with percentages
- **Book-by-Book Analysis**: Questions per book, ranked by count
- **Quality Control**: Identifies books with unusual distributions or low question counts
- **Statistical Summary**: Min/max/median questions per book

#### Usage

```bash
# Analyze questions.json in current directory
python3 scripts/analyze_questions.py

# Analyze a specific file
python3 scripts/analyze_questions.py path/to/questions.json

# Analyze all questions.json files in the repository
python3 scripts/analyze_questions.py --all

# Analyze multiple specific files
python3 scripts/analyze_questions.py file1.json file2.json

# Show help
python3 scripts/analyze_questions.py --help
```

#### Examples

```bash
# From project root
python3 scripts/analyze_questions.py --all

# Analyze 2025-2026 3-5 division data
python3 scripts/analyze_questions.py public/obob/2025-2026/3-5/parent_group/questions.json

# From within a parent_group directory
python3 ../../../../../scripts/analyze_questions.py
```

#### Sample Output

```
========================================
QUESTIONS ANALYSIS: questions.json (2025-2026/3-5)
========================================

📊 OVERALL STATISTICS
Total questions: 3,983
Questions with answers: 2,181 (54.8%)
Questions with page numbers: 3,856 (96.8%)

📝 QUESTIONS BY TYPE
  content: 2,181 (54.8%)
  in-which-book: 1,802 (45.2%)

📚 QUESTIONS BY BOOK (sorted by count)
  finding-langston: 667 (16.7%)
  the-tail-of-emily-windsnap: 374 (9.4%)
  ...
```

## Repository Structure

The script automatically discovers questions.json files throughout the repository structure:

```
public/obob/
├── 2024-2025/
│   ├── 3-5/
│   │   ├── beaverton/questions.json
│   │   ├── cedar_mill/questions.json
│   │   ├── glencoe/questions.json
│   │   └── lake_oswego/questions.json
│   └── 6-8/
│       ├── beaverton/questions.json
│       ├── cedar-mill/questions.json
│       ├── lake-oswego/questions.json
│       └── tabor-middle/questions.json
└── 2025-2026/
    ├── 3-5/
    │   └── parent_group/questions.json
    └── 6-8/
        └── parent_group/questions.json
```

## Requirements

- Python 3.6+
- Standard library only (no external dependencies)

## Adding New Scripts

When adding new scripts to this directory:

1. Make them executable: `chmod +x script_name.py`
2. Add a shebang line: `#!/usr/bin/env python3`
3. Include help/usage information
4. Update this README with documentation
