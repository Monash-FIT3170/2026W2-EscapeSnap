# EscapeSnap

[![CI](https://github.com/Monash-FIT3170/2026W2-EscapeSnap/actions/workflows/ci.yml/badge.svg)](https://github.com/Monash-FIT3170/2026W2-EscapeSnap/actions/workflows/ci.yml)

## Team

- **Youssef Ahmed Adel Attia Hassanein**: `yahm0006@student.monash.edu`
- **Abdullah Wael Abdelazim Ahmed Salem**: `asal0064@student.monash.edu`
- **Casiebelle Le**: `clee0132@student.monash.edu`
- **Prem Veer Reddy Chanumalla**: `pcha0097@student.monash.edu`
- **Awanish Gazmer**: `agaz0007@student.monash.edu`
- **Dylan Gorgioski**: `dgor0011@student.monash.edu`
- **Kayvis Goh**: `zgoh0013@student.monash.edu`
- **Udayan Mishra**: `umis0001@student.monash.edu`
- **Sebastian Gracious Pullanthyanickal**: `spul0008@student.monash.edu`

Mobile-style escape room game (up to 4 players): photograph real-world objects from clues, collect digits for a 4-digit code, beat the countdown, stay in sync in real time. **FIT3170 Software Engineering Practice** (Monash University).

## Prerequisites

- **Meteor** [3.4](https://docs.meteor.com/) (see `.meteor/release`). Install: `curl https://install.meteor.com/ | sh`
- **Node.js** — use the version bundled with your Meteor install for `meteor npm` commands

## Run locally

```bash
cd 2026W2-EscapeSnap
meteor npm install
meteor run
```

Optional settings file:

```bash
meteor run --settings settings.example.json
```

## Scripts

| Command | Purpose |
| --- | --- |
| `meteor npm run start` | Start the app (`meteor run`) |
| `meteor npm run lint` | ESLint |
| `meteor npm run format` | Prettier write |

## CI/CD

The `CI` GitHub Actions workflow runs on pull requests and pushes to `main`. It
installs dependencies, audits npm dependencies for high/critical advisories,
lints, runs the test suite against a temporary MongoDB, builds the Meteor
bundle, and stores that bundle as a 30-day GitHub Actions artifact. Separate
jobs run CodeQL analysis and scan Git history for exposed secrets. The project
does not build container images, so there is no container-image scan.

After a successful CI run on `main`, the deployment workflow deploys that
commit to staging, checks that the app's HTTPS home page responds successfully,
then deploys and smoke-tests production. The production job uses the `production`
GitHub Environment; configure required reviewers under **Settings > Environments
> production** to require approval before release. GitHub Actions reports
workflow status and includes a deployment summary; notification delivery
depends on each user's GitHub notification settings.

Configure these GitHub Environments and values before deployment:

| Environment | Variable | Secrets |
| --- | --- | --- |
| `staging` | `GALAXY_APP_URL` (staging Galaxy hostname, without `https://`) | `GALAXY_STAGING_SESSION` or `METEOR_STAGING_SESSION_FILE`, `STAGING_GEMINI_API_KEY`, `STAGING_MONGO_URL` |
| `production` | Optional `GALAXY_APP_URL` (defaults to `escape-snap.sandbox.galaxycloud.app`) | `GALAXY_SESSION` or `METEOR_SESSION_FILE`, `GEMINI_API_KEY`, `MONGO_URL` |

Use separate staging database and API credentials; do not point staging at
production data. The Galaxy deploy command builds from the checked-out commit;
the CI bundle is retained as a traceable build artifact, while Galaxy creates
its deployment bundle during each environment's deploy. Rollbacks remain a
manual operation outside this workflow.

## Stack

- **Frontend:** React, Tailwind CSS v4 (via PostCSS — see `postcss.config.mjs`)
- **Backend / realtime:** Meteor (DDP), MongoDB
- **E2E (planned):** Playwright in `e2e/` (excluded from the Meteor bundle via `.meteorignore`)

## Spike learnings (short)

- Prefer `insertAsync` / `upsertAsync` in Meteor methods where applicable.
- Playwright lives under `e2e/` with an entry in `.meteorignore` so Meteor does not bundle test files.
- Inspect local MongoDB while the app runs: `mongosh mongodb://127.0.0.1:3001/meteor`

## Environment

Copy `.env.example` to `.env` and fill in:

```
GEMINI_API_KEY=       # required for photo verification + AI-generated riddles
GEMINI_MODEL=         # optional, defaults to gemini-3-flash-preview
```

Get a key from https://aistudio.google.com/apikey. The app boots without `.env` — every variable is optional for startup — but photo submissions and riddle generation will fail without `GEMINI_API_KEY`. `scripts/start.mjs` loads `.env` automatically for `meteor npm run start`.
