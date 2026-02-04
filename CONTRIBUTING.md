# Contributing to Family Finance

Thank you for considering contributing to Family Finance! This project is open-source and built for the community.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- An [InstantDB](https://instantdb.com) account (free tier available)
- Basic knowledge of React, Tailwind CSS, and InstantDB

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/personal-household-finance.git
   cd personal-household-finance
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` and add your InstantDB App ID (and optionally Perplexity and logo.dev API keys)

5. Start the development server:
   ```bash
   npm run dev
   ```

## Code Style Guidelines

### Component Structure
- **Functional components with hooks only** - No class components
- One component per file, matching filename (PascalCase)
- Props destructuring in function signature
- Early returns for loading/error states

### State Management
- Use InstantDB queries via `db.useQuery()` hook
- Use `db.transact()` for all data mutations
- Store user preferences in InstantDB user settings, NOT localStorage
- Use `useToast()` hook for notifications

### Styling
- **Tailwind utility classes only** - No custom CSS files except `index.css`
- Use theme colors from `tailwind.config.js` (e.g., `bg-navy-900`, `text-teal-400`)
- Use `.glass-card` CSS class for glassmorphic cards
- Follow responsive design: desktop-first, use `md:` breakpoints for mobile
- **Accessibility:** All text must meet WCAG AA contrast ratios (4.5:1 for normal text, 3:1 for large text)

### Data Patterns
- **Monetary values:** Always store as numbers (not strings)
- **Dates:** Store as Unix timestamps, format as DD/MM/YYYY for display
- **Percentages:** Store as decimals (3.5 for 3.5%, not 0.035)

## Making Changes

### Branch Naming
Use descriptive branch names:
- `feature/add-loan-categories`
- `fix/chart-rendering-bug`
- `docs/update-readme`

### Commit Messages
Write clear, concise commit messages:
- Use present tense ("Add feature" not "Added feature")
- Reference issue numbers when applicable (`Fix #123: Resolve chart bug`)

### Before Submitting

**Test in both themes:**
- Verify your changes work correctly in both dark and light modes
- Check contrast ratios for any new text colors

**Test responsive design:**
- Verify layout works on desktop and mobile viewports
- Use browser dev tools to test at different breakpoints

**Update documentation:**
- If adding a new feature, update `prd.md` with feature description
- If adding new components, document patterns in `design.md`
- Update `CLAUDE.md` if adding new utilities or patterns

**Run the build:**
```bash
npm run build
```
Ensure there are no build errors or warnings.

## Pull Request Process

1. Ensure your code follows the style guidelines above
2. Update documentation if needed
3. Test thoroughly in both themes and on mobile
4. Push to your fork and submit a pull request
5. Clearly describe your changes in the PR description
6. Link any related issues

### PR Title Format
- `feat: Add multi-currency support`
- `fix: Resolve amortization calculation bug`
- `docs: Update installation instructions`
- `refactor: Simplify mortgage calculations`

## Code Review

All submissions require review. We may ask for changes before merging. Please be patient and responsive to feedback.

## Questions?

If you have questions about contributing, feel free to open an issue with the "question" label.

## License

By contributing to Family Finance, you agree that your contributions will be licensed under the MIT License.
