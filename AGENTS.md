# Repository Guidelines

## Project Structure & Module Organization

CDI0436 contains two independently managed TypeScript applications:

- `backend/src/modules/`: NestJS feature modules with controllers, services, TypeORM entities, and validation DTOs. Shared infrastructure lives in `src/common/`; database migrations in `src/migrations/`.
- `backend/src/**/*.spec.ts`: unit tests; `backend/test/`: end-to-end tests.
- `frontend/src/app/`: Next.js App Router pages and layouts. Feature components live in `src/components/`; API clients, React Query hooks, types, and utilities in `src/lib/`.
- `frontend/public/`: static assets. Root `docker-compose.yml` runs PostgreSQL; `.github/` contains CI and the PR template.

## Build, Test, and Development Commands

Use Node.js 20, matching CI. Run `npm ci` separately inside `backend/` and `frontend/`.

| Directory | Command | Purpose |
| --- | --- | --- |
| Root | `docker compose up -d postgres` | Start local PostgreSQL |
| `backend/` | `npm run start:dev` | Start API with watch mode |
| `frontend/` | `npm run dev` | Start Next.js locally |
| Either app | `npm run build` | Build for production |
| `backend/` | `npm run lint:check` | Check ESLint without edits |
| `frontend/` | `npm run lint` | Check ESLint |
| `frontend/` | `npx tsc --noEmit` | Check TypeScript types |

## Coding Style & Naming Conventions

Use two-space indentation and follow nearby code. Backend Prettier uses single quotes and trailing commas; run `npm run format` there. Backend `npm run lint` also applies fixes. Frontend uses Next.js ESLint rules and Tailwind styles.

Use NestJS filenames such as `usuarios.service.ts` and `create-usuario.dto.ts`; React components use PascalCase (`UsuarioForm.tsx`), and hooks use `useUsuarios.ts`. Preserve established Spanish domain terminology.

## Testing Guidelines

Backend tests use Jest, Nest testing utilities, and Supertest. Run `npm test -- --runInBand`, `npm run test:e2e`, or `npm run test:cov` from `backend/`. Name unit tests `*.spec.ts` and integration tests `*.e2e-spec.ts`. No coverage threshold is configured. Add tests for new behavior. Frontend has no configured test runner; verify changed flows manually alongside lint, typecheck, and build.

## Commit & Pull Request Guidelines

Follow `CONTRIBUTING.md` and existing Conventional Commits: `feat(merito): ...`, `fix: ...`, `docs: ...`. Use `feature/`, `fix/`, `refactor/`, or `docs/` branches. Submit changes through PRs with at least one approval and passing CI. Complete `.github/PULL_REQUEST_TEMPLATE.md`: explain the change, provide verification steps, link relevant issues, and optionally include screenshots.

## Security & Configuration

Configure `backend/.env` from `.env.example` and `frontend/.env.local` with `NEXT_PUBLIC_API_URL`. Never commit real credentials, runtime uploads, database dumps, or backend `_*.ts`/`_*.js` scratch files.
