# Claude Code Configuration

This directory contains custom configurations and commands for Claude Code.

## Custom Commands

Custom slash commands are located in `.claude/commands/`. You can use these in Claude Code by typing `/command-name`.

### Available Commands

- **/test** - Run linting and build checks
- **/add-question** - Interactive wizard to add a new question
- **/add-book** - Interactive wizard to add a new book
- **/deploy** - Prepare the app for deployment
- **/component** - Create a new React component following project conventions

## Usage

In Claude Code, simply type `/` followed by the command name:

```
/test
/add-question
/component
```

## Creating New Commands

To create a new command:

1. Create a new `.md` file in `.claude/commands/`
2. Add frontmatter with a description:
   ```markdown
   ---
   description: Your command description
   ---

   Your command instructions here...
   ```
3. Use the command in Claude Code with `/your-command-name`

## Project Context

The main project context is in `CLAUDE.md` at the root of the repository. This file helps Claude Code understand the project structure, conventions, and common tasks.

## Ignore Patterns

`.claudeignore` at the root specifies which files Claude Code should ignore (similar to `.gitignore`).
