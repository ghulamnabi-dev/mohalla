# Mohalla

[![CI](https://github.com/ghulamnabi-dev/mohalla/actions/workflows/ci.yml/badge.svg)](https://github.com/ghulamnabi-dev/mohalla/actions/workflows/ci.yml)
![.NET 9](https://img.shields.io/badge/.NET-9.0-512BD4?logo=dotnet&logoColor=white)
![Angular 19](https://img.shields.io/badge/Angular-19-DD0031?logo=angular&logoColor=white)
![SQL Server](https://img.shields.io/badge/SQL%20Server-2022-CC2927?logo=microsoftsqlserver&logoColor=white)
![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)

**Mohalla** (Urdu: *neighbourhood*) keeps a housing society's books: residents, monthly contributions, categorised expenses, and a month-by-month ledger that is generated automatically and carries the closing balance forward. Admins record and manage; viewers get a read-only view of the same figures.

<p align="center">
  <img src="client/docs/screenshots/cover.png" alt="Mohalla: a resident's statement with every short month and the running balance, and the dashboard in dark mode behind it" width="100%">
</p>

<p align="center">
  <img src="client/docs/screenshots/tour.gif" alt="30-second tour: sign in, dashboard, resident statement, record a payment, ledger, dark mode" width="100%">
</p>

## Repository layout

```
mohalla/
├── client/     Angular 19 + Material 3 web app            → client/README.md
├── server/     ASP.NET Core 9 Web API, EF Core, Hangfire   → server/README.md
├── docker-compose.yml   SQL Server + API + web, one command
└── .github/workflows    CI: API build & tests · web tests & build · Docker images
```

Each half has its own README with features, API routes, conventions and test notes. This page is the overview.

## Architecture

```
 Browser ──► nginx (client image)  ──► /api/* ──► ASP.NET Core 9 API ──► SQL Server 2022
             static Angular bundle                 Controllers → Services → Repositories
                                                   Identity + JWT (Admin / Viewer)
                                                   Hangfire: monthly ledger job  (cron 5 0 1 * *)
```

- In production the client and API share an origin (`/api` is proxied), so there is no CORS to configure.
- In development the Angular dev server runs on `:4200` and talks to the API on `:5091`; CORS allows that origin.

## Quick start (Docker)

```bash
cp .env.example .env            # set SA_PASSWORD and a 32+ char JWT_SECRET
docker compose up --build
```

| | URL |
|---|---|
| Web app | http://localhost:4200 |
| API, Swagger UI | http://localhost:5091 |
| Hangfire dashboard | http://localhost:5091/hangfire |

The first account you register becomes **Admin**. To fill the app with a year of demo data:

```bash
cd client && npm ci && npm run seed      # 13 residents, 12 months of payments/expenses, ledger rows; creates demo@mohalla.local
```

## Develop locally

```bash
# API — needs .NET 9 SDK and SQL Server (LocalDB is fine); see server/README.md for user-secrets
cd "server/Society Management System" && dotnet ef database update && dotnet run        # http://localhost:5091

# Web — needs Node 22
cd client && npm ci && npm start                                                       # http://localhost:4200
```

## Tests

```bash
cd server && dotnet test "Society Management System.Tests"     # 11 integration tests: real app on in-memory SQLite via WebApplicationFactory
cd client && npm test                                           # 94 unit specs: auth, guards, interceptor, API client, chart, dashboard & statement maths
```

Both suites run on every push ([CI](.github/workflows/ci.yml)), followed by a Docker build of both images.

## Engineering highlights

- **Layered API** — `Controllers → Services → Repositories`, every dependency behind an interface; controllers never touch EF Core.
- **Roles end to end** — Identity + JWT role claim; `[Authorize(Roles = …)]` on every write, and a structural `*appAdminOnly` directive hides the same controls in the UI.
- **Scheduled domain logic that self-heals** — Hangfire opens each month's ledger row; a back-dated entry arriving first creates it on demand.
- **Contract-first errors** — RFC 7807 `ValidationProblemDetails` from the API land on the matching form fields in the client.
- **Designed to be tested** — database provider and background server are configurable, so the real app boots on SQLite inside the tests.
- **Modern Angular** — standalone components, signals, new control flow, functional guards/interceptors, lazy routes, a 60-line SVG chart instead of a charting dependency, ~114 kB gzipped initial bundle.
- **Design system as tokens** — one accent, flat surfaces, dense tables; light and dark from the same stylesheet.

## Roadmap

- [x] Role-based access (Admin / Viewer)
- [x] Resident statement with running balance
- [x] Paged, filterable list endpoints
- [x] One-command Docker stack for the whole app
- [ ] Deploy a demo with seeded data
- [ ] Receipt PDF per payment
- [ ] E2E smoke tests with Playwright

## License

MIT © Ghulam Nabi
