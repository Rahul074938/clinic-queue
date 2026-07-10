# Contributing to ClinicQueue

Thank you for your interest in improving ClinicQueue! This document explains the
conventions we follow so that contributions are consistent and easy to review.

---

## Development Setup

```bash
git clone https://github.com/your-org/clinic-queue.git
cd clinic-queue
cp .env.example .env.local   # fill in values
npm install
node --import tsx/esm prisma/seed.ts  # seed demo data
npm run dev
```

Open <http://localhost:3000> and sign in with `demo@demo.com / demo1234`.

---

## Conventions

### Commits
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <summary>

[optional body]
[optional footer(s)]
```

Common types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`.

Examples:
```
feat(queue): add per-doctor call-next button
fix(auth): redirect loop on unauthenticated /admin
docs: update README quick-start
```

### Branching
| Branch | Purpose |
|--------|---------|
| `main` | Stable, deployed to production |
| `dev` | Integration branch for PRs |
| `feat/<name>` | New feature |
| `fix/<name>` | Bug fix |
| `chore/<name>` | Tooling / dependency updates |

### Pull Requests
- Target `dev` unless it is a hotfix against `main`
- Fill in the PR template (auto-populated)
- All CI checks must pass: lint, type-check, unit tests
- At least one approving review is required

---

## Code Style

- **TypeScript strict** — no `any`, no `@ts-ignore`
- **Zod** — validate every external input at the API boundary
- **ESLint** — `npm run lint` must produce zero warnings
- **Prettier** — formatting is enforced via `eslint-config-prettier`

---

## Testing

```bash
npm test          # Vitest unit tests
npm run lint      # ESLint
npm run type-check  # tsc --noEmit
```

Add a Vitest test for any new utility function in `lib/`.

---

## Database Changes

1. Modify `prisma/schema.prisma`
2. Run `node node_modules\prisma\build\index.js migrate dev --name <description>`
3. Update `prisma/seed.ts` if new entities need demo data
4. Commit the generated migration file alongside the schema change

---

## Reporting Issues

Please open a GitHub Issue using the appropriate template:
- 🐛 **Bug Report** — unexpected behaviour with reproduction steps
- 💡 **Feature Request** — proposed enhancement with rationale

---

## License

By contributing you agree that your work will be licensed under the [MIT License](LICENSE).
