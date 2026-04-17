# EscapeSnap

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

## Stack

- **Frontend:** React, Tailwind CSS v4 (via PostCSS — see `postcss.config.mjs`)
- **Backend / realtime:** Meteor (DDP), MongoDB
- **E2E (planned):** Playwright in `e2e/` (excluded from the Meteor bundle via `.meteorignore`)

## Spike learnings (short)

- Prefer `insertAsync` / `upsertAsync` in Meteor methods where applicable.
- Playwright lives under `e2e/` with an entry in `.meteorignore` so Meteor does not bundle test files.
- Inspect local MongoDB while the app runs: `mongosh mongodb://127.0.0.1:3001/meteor`

## Environment

