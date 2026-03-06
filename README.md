# Backtrak

Backtrak is an internal backlog-tracking app for GitLab teams. The current codebase provides a Next.js web app with Google sign-in, PostgreSQL-backed authentication, and a site-access approval flow for controlling who can enter the product.

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Scripts](#scripts)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

---

# About

Backtrak exists to give internal teams a focused place to manage and review backlog work coming from GitLab. The long-term product direction is captured in [ARCHITECTURE.md](./ARCHITECTURE.md), while the current implementation establishes the foundation: authentication, persistence, protected routes, and site-level access control.

Today, the repository is centered around the web app in `apps/web`. Users authenticate with Google through Better Auth, session and account data are stored in PostgreSQL via Prisma, and only approved email addresses can access the protected parts of the app.

---

# Features

- Google OAuth sign-in powered by Better Auth
- PostgreSQL and Prisma-backed user, session, account, and verification storage
- Protected `/` and `/dashboard` routes for authenticated users
- Site-access grant flow with pending and revoked access states
- Seed script for pre-approving allowed email addresses

---

# Tech Stack

- Next.js 16
- React 19
- TypeScript
- Better Auth
- Prisma 7
- PostgreSQL
- Bun
- Biome
- Vitest, React Testing Library, and Playwright dependencies

---

# Installation

Clone the repository:

```bash
git clone https://github.com/samyakpiya/backtrak.git
cd backtrak
```

Install dependencies for the web app:

```bash
cd apps/web
bun install
```

---

# Environment Variables

Create an environment file for the web app:

```bash
cp apps/web/.env.example apps/web/.env
```

Configure `apps/web/.env` with the values below:

```bash
POSTGRES_DB=backtrak
POSTGRES_HOST_PORT=5432
POSTGRES_PASSWORD=postgres
POSTGRES_USER=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/backtrak
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SITE_ACCESS_GRANT_SEED_EMAILS=alice@example.com,bob@example.com
```

Notes:

- `SITE_ACCESS_GRANT_SEED_EMAILS` is optional, but useful for seeding approved users in development.
- For local Google OAuth, set the authorized JavaScript origin to `http://localhost:3000`.
- For local Google OAuth, set the authorized redirect URI to `http://localhost:3000/api/auth/callback/google`.

---

# Usage

Start local PostgreSQL from the repository root:

```bash
docker compose up -d postgres
```

Apply database migrations and optionally seed access grants:

```bash
cd apps/web
bun --bun run prisma migrate dev
bun run db:seed:site-access-grants
```

Start the development server:

```bash
cd apps/web
bun run dev
```

Start the production server locally:

```bash
cd apps/web
bun run build
bun run start
```

The app is available at [http://localhost:3000](http://localhost:3000).

---

# Project Structure

```text
backtrak/
├── apps/
│   └── web/
│       ├── prisma/
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   └── lib/
│       ├── .env.example
│       └── package.json
├── ARCHITECTURE.md
├── docker-compose.yml
├── LICENSE.md
└── README.md
```

---

# Scripts

Run these from `apps/web`:

```bash
bun run dev                         # start the Next.js development server
bun run build                       # create a production build
bun run start                       # run the production build
bun run lint                        # run Biome lint with autofixes
bun run fmt                         # format files with Biome
bun run db:seed:site-access-grants  # seed or refresh site-access grants
```

---

# Testing

Testing tooling is present in the web app.

Current testing notes:

- Vitest, React Testing Library, MSW, and Playwright dependencies are installed in `apps/web`.
- A dedicated `bun run test` script has not been added yet.
- Vitest path alias wiring is not fully configured yet, so test execution is still being finalized.

---

# Deployment

Production deployment is not fully scripted in this repository yet.

Current deployment requirements:

- Deploy `apps/web` to a Next.js-compatible host
- Provide a reachable PostgreSQL database
- Set `BETTER_AUTH_URL`, `DATABASE_URL`, `GOOGLE_CLIENT_ID`, and `GOOGLE_CLIENT_SECRET`
- Run the production build with `bun run build` and `bun run start`

The checked-in `docker-compose.yml` is for local PostgreSQL development only and does not deploy the web app itself.

---

# Contributing

Contributions are welcome.

Suggested workflow:

1. Fork the repository.
2. Create a focused feature branch.
3. Make your changes and update documentation when behavior or setup changes.
4. Open a Pull Request with a clear summary of what changed.

---

# License

This project is licensed under the MIT License. See [LICENSE.md](./LICENSE.md) for details.

---

# Contact

Maintainer: Samyak Piya  
Email: samyakpiya@gmail.com  
GitHub: [https://github.com/samyakpiya](https://github.com/samyakpiya)

---
