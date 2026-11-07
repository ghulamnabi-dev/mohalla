# Society Management System — Web client

[![CI](https://github.com/gn-4200/SMS/actions/workflows/ci.yml/badge.svg)](https://github.com/gn-4200/SMS/actions/workflows/ci.yml)
![Angular 19](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)
![Angular Material 3](https://img.shields.io/badge/Material-3-757575?logo=materialdesign&logoColor=white)
![TypeScript strict](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

Admin dashboard for a housing society's finances: residents, monthly contributions, categorised expenses and an auto-balancing monthly ledger. Talks to the ASP.NET Core 9 API in **[gn-4200/SocietyManagmentSystem](https://github.com/gn-4200/SocietyManagmentSystem)**.

<p align="center">
  <img src="docs/screenshots/02-dashboard.png" alt="Dashboard — KPIs, 12-month collected vs. spent chart, recent activity" width="100%">
</p>

| Contributions | Monthly ledger |
|---|---|
| ![Contributions table with filters and paid/outstanding status](docs/screenshots/04-funds.png) | ![Ledger with trend chart and net column](docs/screenshots/06-ledger.png) |

| Sign in | Dark mode | Mobile |
|---|---|---|
| ![Sign in](docs/screenshots/01-login.png) | ![Dashboard, dark theme](docs/screenshots/08-dashboard-dark.png) | <img src="docs/screenshots/09-mobile.png" alt="Dashboard on a phone" width="220"> |

## Features

- **Dashboard** — residents, collected / outstanding this month, spent this month, closing balance; a 12-month collected-vs-spent chart; recent payments and expenses.
- **Residents** — searchable, sortable, paginated table; add/edit in a dialog with validation (11-digit phone).
- **Contributions** — year/month filters, running totals, paid/outstanding chips; record a payment by picking the resident and a date, outstanding computed live.
- **Expenses** — category filter, inline category management (add / rename / delete persisted to the API).
- **Monthly ledger** — opening, collected, spent, net and closing per month; trend chart; CSV export.
- **Auth** — JWT stored client-side, route guards, bearer interceptor, automatic sign-out on 401, session-expiry check from the token's `exp`.
- **UI** — Material 3 theming with light/dark toggle (persisted, no flash on load), responsive down to 375 px, self-hosted Inter + Material Icons (no third-party font CDN), reduced-motion support.

## Stack & conventions

| | |
|---|---|
| Angular 19 | standalone components, signals, new control flow (`@if` / `@for`), lazy-loaded routes, `inject()` |
| Angular Material 19 | `mat.theme()` system tokens; `MatTableDataSource` with sort + paginator; dialogs; snack-bars |
| Forms | typed reactive forms (`nonNullable`), cross-field validators |
| HTTP | thin `CrudApi<T>` base per resource, functional interceptor |
| Charts | a 60-line SVG bar chart component — no charting dependency |
| Quality | TypeScript `strict`, `strictTemplates`, Prettier, EditorConfig, GitHub Actions (test + production build) |

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

Point the client at a different API by editing `src/environments/environment.development.ts` (dev) or `environment.ts` (production builds).

Start the API with Docker from the server repo: `docker compose up --build` (see its README), or run it with the .NET SDK.

```bash
npm run seed         # demo data: 13 residents, 12 months of payments/expenses, ledger rows; creates demo@sms.local
```

```bash
npm test             # Karma + Jasmine, headless Chrome
npm run build:prod   # outputs dist/sms/browser — deploy as static files (Vercel, Netlify, GitHub Pages, nginx)
```

## Roadmap

- [ ] Resident statement page (one resident's payment history + balance)
- [ ] Role-based UI once the API exposes roles
- [ ] E2E smoke tests with Playwright
- [ ] Deploy a demo with seeded data

## License

MIT © Ghulam Nabi
