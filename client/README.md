# Mohalla — Web client

[![CI](https://github.com/gn-4200/mohalla/actions/workflows/ci.yml/badge.svg)](https://github.com/gn-4200/mohalla/actions/workflows/ci.yml)
![Angular 19](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)
![Angular Material 3](https://img.shields.io/badge/Material-3-757575?logo=materialdesign&logoColor=white)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

**Mohalla** (Urdu: *neighbourhood*) keeps a housing society's books: residents, monthly contributions, categorised expenses and an auto-balancing monthly ledger. This folder is the Angular client; the ASP.NET Core 9 API is in [`../server`](../server/README.md), and the [root README](../README.md) has the one-command Docker stack.

<p align="center">
  <img src="docs/screenshots/cover.png" alt="Mohalla — dashboard in light mode and a resident statement in dark mode" width="100%">
</p>

<p align="center">
  <img src="docs/screenshots/tour.gif" alt="30-second tour: sign in, dashboard, resident statement, record a payment, ledger, dark mode" width="100%">
</p>

<details>
<summary><strong>More screens</strong> — statement, contributions, expenses, users, mobile</summary>
<br>

| Resident statement | Contributions |
|---|---|
| ![Resident statement with running balance](docs/screenshots/03-statement.png) | ![Contributions with filters and shortfall status](docs/screenshots/04-contributions.png) |

| Record a payment | Expenses |
|---|---|
| ![Record payment dialog with live outstanding amount](docs/screenshots/05-record-payment.png) | ![Expenses by category](docs/screenshots/06-expenses.png) |

| Monthly ledger (dark) | Users & roles |
|---|---|
| ![Ledger with trend chart](docs/screenshots/07-ledger-dark.png) | ![Users page with inline role change](docs/screenshots/09-users.png) |

| Sign in | Mobile |
|---|---|
| ![Sign in](docs/screenshots/01-login.png) | <img src="docs/screenshots/10-mobile.png" alt="Dashboard on a phone" width="260"> |

</details>

## Features

- **Dashboard** — KPIs with month-over-month deltas, a 12-month collected-vs-spent chart, this month's collection progress with the households that have not paid (tap to call), and a merged activity table.
- **Residents** — searchable, sortable, paginated table; add/edit in a dialog with validation (11-digit phone).
- **Contributions** — year/month filters, running totals, paid/outstanding chips; record a payment by picking the resident and a date, outstanding computed live.
- **Expenses** — category filter, inline category management (add / rename / delete persisted to the API).
- **Monthly ledger** — opening, collected, spent, net and closing per month; trend chart; CSV export.
- **Resident statement** — a resident's full payment history with running balance, totals, and a print stylesheet; record a payment straight from it.
- **Roles** — Admin / Viewer from the JWT role claim: viewers get a read-only UI (no add/edit/delete, no actions column), admins manage accounts on the Users page. Server validation errors land on the matching form fields.
- **Auth** — JWT stored client-side, route guards (auth, guest, admin), bearer interceptor, automatic sign-out on 401, session-expiry check from the token's `exp`.
- **UI** — a quiet admin aesthetic: one accent, flat surfaces, dense tables, tabular figures; light/dark theme persisted with no flash on load; responsive to 375 px; self-hosted Inter + Material Icons; reduced-motion support.

## Engineering highlights

- **Angular 19 the modern way** — standalone components, signals and `computed()` for all derived state, the new control flow, `inject()`, functional guards and interceptors, lazy routes.
- **Role-aware UI from one primitive** — a structural `*appAdminOnly` directive driven by the JWT role claim hides every mutating control for viewers; the API enforces the same rule with 403s.
- **Thin typed API layer** — a generic `CrudApi<T>` base per resource, so each service is a few lines and the HTTP surface is consistent.
- **Server errors land where the user looks** — `ValidationProblemDetails` from the API is mapped onto the matching form controls instead of a generic toast.
- **Design system as tokens** — Material 3 system variables plus a small custom token set (one accent, flat surfaces) give light and dark from the same stylesheet; no per-component colour.
- **Tested logic** — 94 unit specs cover auth, guards, interceptor, API client, chart geometry and the dashboard / statement arithmetic.

## Stack & conventions

| | |
|---|---|
| Angular 19 | standalone components, signals, new control flow (`@if` / `@for`), lazy-loaded routes, `inject()` |
| Angular Material 19 | `mat.theme()` system tokens; `MatTableDataSource` with sort + paginator; dialogs; snack-bars |
| Forms | typed reactive forms (`nonNullable`), cross-field validators |
| HTTP | thin `CrudApi<T>` base per resource, functional interceptor |
| Charts | a 60-line SVG bar chart component — no charting dependency |
| Quality | TypeScript `strict`, `strictTemplates`, 94 unit tests (services, guards, interceptor, chart, dashboard and funds maths, statement balance), Prettier, EditorConfig, GitHub Actions |

```
src/app
├── core/          models, auth (service · guard · interceptor · token), api services, notifications, theme
├── shared/        page-header, stat-card, bar-chart, empty-state, confirm-dialog, pipes (pkr, monthName)
├── layout/        app shell: sidenav + toolbar + user menu
└── features/      auth · dashboard · residents · funds · expenses · summary (one folder per route)
```

Production bundle: **~114 kB gzipped** initial, features lazy-loaded.

## Run it

```bash
npm ci
npm start            # http://localhost:4200 — expects the API at http://localhost:5091
```

The dev build calls the API at `http://localhost:5091/api` (`src/environments/environment.development.ts`). Production builds call `/api` on the same origin and expect the host to proxy it to the API — the `Dockerfile` + `nginx.conf` here do exactly that, and `docker compose up` at the repo root runs the whole stack.

Start the API from `../server` (see its README), or `docker compose up db api` from the repo root.

```bash
npm run seed         # demo data: 13 residents, 12 months of payments/expenses, ledger rows; creates demo@mohalla.local
```

```bash
npm test             # Karma + Jasmine, headless Chrome
npm run build:prod   # outputs dist/mohalla-web/browser — static files; put them behind any host that proxies /api to the API
```

## Roadmap

- [x] Resident statement page
- [x] Role-based UI (Admin / Viewer)
- [ ] Server-side paging for the contributions and expenses tables
- [ ] E2E smoke tests with Playwright
- [ ] Deploy a demo with seeded data

## License

MIT © Ghulam Nabi
