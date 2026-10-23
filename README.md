# EscapeSnap

*FIT3170 Software Engineering Practice, Monash University. Release v1.0.0 (20 October 2026).*

EscapeSnap is a mobile-first, multiplayer escape-room game for teams of 2–4 players, including two-team matches. Players read AI-generated riddles, photograph or sketch the matching real-world object, collect letters, and crack the final riddle before the countdown ends. The host screen and every phone stay in sync in real time.

This document is for whoever picks up the repository next. It is team-wide rather than scoped to one person's tickets, completes the Milestone 3 draft, and describes the codebase as released at **v1.0.0**.

| Resource              | Link                                                                                                                                                                                  |
|-----------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Live app (production) | <https://escape-snap.sandbox.galaxycloud.app>                                                                                                                                         |
| Repository            | <https://github.com/Monash-FIT3170/2026W2-EscapeSnap>                                                                                                                                 |
| Project board         | [github.com/orgs/Monash-FIT3170/projects/8](https://github.com/orgs/Monash-FIT3170/projects/8/views/1) (roadmap: [view 3](https://github.com/orgs/Monash-FIT3170/projects/8/views/3)) |
| Related documents     | User Guide, UAT Plan and Maintenance Plan Summary (submitted with this document)                                                                                                      |

## 1. Summary for new developers

A game has a **host** (laptop or projector; routes under `/host` and `/game/:id/*`) and **players** (phones; routes under `/player` and `/join/:code`). Everything runs through one Meteor server: clients call **Methods** to change state and subscribe to **publications** to see it, so there is no REST API and no polling. Game state lives in MongoDB; Gemini is only called server-side, to write riddles and to check photos and sketches.

- **Where to start reading:** `server/main.js` (startup, Gemini wiring, background sweeps) → `imports/api/games/gamesMethods.js` (create / start / finish) → `imports/api/rounds/roundsMethods.js` (submit an answer, settle a round) → `imports/ui/App.jsx` (all routes).
- **Folder pattern:** most feature folders in `imports/api/` share the same layout: `XCollection.js` (schema), `xMethods.js` (writes), `xPublications.js` (reads), with tests next to the code. Exceptions: `submissions` has no Methods file (`submissions.classify` lives in `server/main.js`), and `gemini` and `riddles` hold Gemini helpers rather than collections.
- **First-day checklist:** clone, `meteor npm install`, `meteor run`, open `http://localhost:3000` in one window and `http://localhost:3000/player` in a phone-sized window, then run `meteor npm test`.
- **Ask before touching:** schemas in `*Collection.js` (deployed data must still validate) and Method names used by the UI (renaming one breaks games already open).

## 2. Prerequisites

- **Meteor 3.4**: see `.meteor/release` (currently `METEOR@3.4.1`). Install with `curl https://install.meteor.com/ | sh` (macOS/Linux) or `npx meteor` (Windows).
- **Node.js**: use the version bundled with Meteor (`meteor node -v`) and always prefix npm with `meteor` (`meteor npm …`) so versions match CI.
- **Git** and a GitHub account with access to the Monash-FIT3170 organisation.
- **Optional:** a Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (AI riddles and photo/sketch checks), `mongosh` for inspecting data, and Chromium for Playwright (`meteor npx playwright install chromium`).
- **Testing on a phone:** the camera only works over HTTPS or on localhost. Browsers block it on a LAN IP, so test phone features on the deployed URL or through an HTTPS tunnel.

## 3. Repository setup

    git clone https://github.com/Monash-FIT3170/2026W2-EscapeSnap.git
    cd 2026W2-EscapeSnap
    meteor npm install
    meteor npm run start      # loads .env, then runs meteor (http://localhost:3000)

**Windows:** if `meteor npm install` fails on path resolution, run `meteor npm run patch:meteor-win` once, then use `meteor npm run start:windows`.

### Environment variables (optional for local development)

Copy `.env.example` to `.env` and fill in only what you need. **Comment out the `MONGO_URL` line** when running locally: it points at a MongoDB on port 27017 that normally isn't running, so `meteor run` fails to connect. Its Google Vision and AWS Rekognition entries are unused leftovers. The app boots with none of these set: riddles then come from the built-in bank (`imports/lib/riddleBank.js`, `imports/lib/finalRiddle.js`) and photo/sketch checks report "Photo verification is not configured".

| Variable                                    | Needed for                                | Notes                                                                                                                     |
|---------------------------------------------|-------------------------------------------|---------------------------------------------------------------------------------------------------------------------------|
| `GEMINI_API_KEY`                            | AI riddles, photo and sketch verification | Server-only. Never commit it; production reads it from a GitHub secret.                                                   |
| `GEMINI_MODEL`                              | Choosing the first Gemini model           | Defaults to `gemini-3-flash-preview`; falls back through the list in `imports/api/gemini/geminiModels.js` on 404/429/500/503. |
| `ADMIN_KEY`                                 | Unlocking the `/admin` operations page    | When unset, `/admin` stays locked. Enter the key on the page to see live games and force-end them.                        |
| `MONGO_URL`                                 | Production database                       | Leave unset locally: `meteor run` starts its own MongoDB on port 3001.                                                    |
| `E2E_FAKE_CLASSIFY`, `E2E_PORT`, `E2E_DEMO` | Playwright only                           | `E2E_FAKE_CLASSIFY=pass` marks every photo correct. Ignored in production builds.                                         |

**Meteor settings (optional):** copy `settings.example.json` to `settings.json` (git-ignored) for local overrides, then run `meteor run --settings settings.json`.

### Scripts

| Command                                            | Purpose                                                                 |
|----------------------------------------------------|-------------------------------------------------------------------------|
| `meteor npm run start`                             | Start the app (loads `.env`, then `meteor run`)                         |
| `meteor npm run lint`                              | ESLint + Prettier rules (CI fails on any error)                         |
| `meteor npm test`                                  | Unit, frontend component and Meteor integration tests                   |
| `meteor npm run test:unit`                         | Pure-logic tests with Node's built-in test runner\*                     |
| `meteor npm run test:ui`                           | React component tests (Vitest + React Testing Library, jsdom)           |
| `meteor npm run test:meteor`                       | Methods and publications against a real MongoDB (`meteortesting:mocha`) |
| `meteor npm run test:e2e`                          | Playwright end-to-end tests (starts its own app on port 3000)           |
| `meteor npm run test:e2e:ui` / `:demo` / `:report` | Visual runner / slowed-down presentation mode / last HTML report        |
| `meteor npm run format`                            | Prettier write                                                          |

\* `test:unit` uses `--experimental-default-type`, which Node 23+ removed. Run it through `meteor npm` (Meteor's bundled Node) or call `node --test <files>` directly.

## 4. Architecture overview

One Meteor server owns all state. Phones and the host never talk to each other or to Gemini directly; they only call Methods and receive publication updates over DDP (a WebSocket).

      Host screen (laptop)                     Player phones (2–4 per team)
      /host, /game/:id/*, /match/:id/*         /player, /join/:code
                \                                   /
                 \---- DDP over WebSocket: Methods (writes) ----/
                  \--- and publications (live reads) ----------/
                                  |
                     Meteor server (server/main.js)
            +---------------------+------------------------+
            |                     |                        |
      imports/api/*          Gemini API             Background sweeps (15 s)
      Methods + pubs         riddles, photo and     game expiry, player
      + schema checks        sketch verification    presence / reconnect
            |
      MongoDB: games, players, rounds, roundSessions, submissions,
               matches, gameEvents, gameResults

### One answer, end to end (photo → server → Gemini → Mongo → DDP → clients)

1.  **Phone:** the player captures a frame (or finishes a sketch). The client shrinks it to a JPEG and calls the `submissions.classify` Method (in `server/main.js`) with the image, target object, round id and answer mode.
2.  **Server → Gemini:** the server builds the prompt (`classifyPrompt.js`) and asks Gemini whether the image shows the target object. Failed models fall back down the list in `geminiModels.js`.
3.  **Server → Mongo:** on a match the client calls `rounds.submit`; the server settles the round once (a status guard stops double letters), stores the submission and photo, and writes a `gameEvents` entry.
4.  **Round progression:** when every riddle in the round is solved or skipped, `roundProgression.js` advances the game (riddles of a player who left are handed to teammates via `coveredBy`); after the last round the host gets the final riddle (3 attempts).
5.  **DDP → clients:** publications push the changed documents to the host progress page, the event log and every phone immediately, so no screen polls.

### Code map

| Path                                                    | What lives there                                                                                     |
|---------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| `server/main.js`                                        | Startup, Gemini client set-up, publication/Method imports, presence and expiry sweeps                |
| `imports/api/games`, `rounds`, `players`, `submissions` | Core game loop: schemas, Methods, publications, round progression, game expiry                       |
| `imports/api/matches`                                   | Team-vs-team matches (two linked games, shared lobby and progress page)                              |
| `imports/api/riddles`, `gemini`                         | Riddle-generation prompts, Gemini client, model fallback                                             |
| `imports/api/events`, `achievements`, `admin`           | Live event log, end-of-game results/leaderboard, `/admin` monitor                                    |
| `imports/lib`                                           | Shared pure logic: riddle bank, COCO object list, answer modes, custom themes, UI themes, game clock |
| `imports/ui/host`, `mobile`, `shared`                   | Host pages, player pages, shared components and hooks                                                |
| `imports/languages`                                     | i18n: language provider, flag picker, error translations and locale files (7 languages)             |
| `e2e/`                                                  | Playwright config, helpers and specs (excluded from the bundle via `.meteorignore`)                  |
| `.github/workflows`                                     | `ci.yml` (checks) and `deploy.yml` (staging → production on Galaxy)                                  |

### Stack

- **Frontend:** React 19, React Router 6, Tailwind CSS v4 + DaisyUI (via PostCSS, configured in `postcss.config.mjs`), `qrcode.react` for join QR codes. Five UI themes (`imports/lib/uiThemes.js`) and 7 languages.
- **Backend / real-time:** Meteor 3.4.1 (DDP Methods + publications), MongoDB with `simpl-schema` / `collection2` validation.
- **AI:** Google Gemini (`gemini-3-flash-preview` first, then fallbacks) for riddle generation and photo/sketch verification.
- **Testing:** Node test runner (unit), Vitest + React Testing Library + jsdom (components), `meteortesting:mocha` (integration), Playwright (17 end-to-end tests, including three full games).
- **Hosting / CI/CD:** Meteor Galaxy (free sandbox tier) deployed by GitHub Actions; Dependabot for dependency updates.

## 5. Deployment and CI/CD

**CI (`ci.yml`)** runs on every pull request and push to `main`, weekly on `main`, and on demand: `npm audit` (high/critical), lint, unit and component tests with coverage, Meteor tests against a temporary MongoDB, the Playwright end-to-end tests, and a production build. A CodeQL scan and a Gitleaks secret scan run as separate jobs. A single **CI gate** job passes only when all of them pass, and that is the check branch protection should require.

**Deploy (`deploy.yml`)** starts automatically after CI succeeds on `main` (or manually via *Run workflow*). It deploys to staging and smoke-tests it, then deploys to production at [escape-snap.sandbox.galaxycloud.app](https://escape-snap.sandbox.galaxycloud.app) and checks the HTTPS home page responds. Staging is skipped until its secrets exist (#127). Production uses the `production` GitHub Environment, so required reviewers can be added there.

| Environment  | Variable                                                                      | Secrets                                                                                                                                |
|--------------|-------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------|
| `production` | Optional `GALAXY_APP_URL` (defaults to `escape-snap.sandbox.galaxycloud.app`) | `GALAXY_SESSION` or `METEOR_SESSION_FILE`, `GEMINI_API_KEY`, `MONGO_URL`, optional `ADMIN_KEY`                                         |
| `staging`    | `GALAXY_APP_URL` (staging hostname, no `https://`)                            | `GALAXY_STAGING_SESSION` or `METEOR_STAGING_SESSION_FILE`, `STAGING_GEMINI_API_KEY`, `STAGING_MONGO_URL`, optional `STAGING_ADMIN_KEY` |

**Rollback:** revert the bad PR on `main` (GitHub *Revert* button). CI and deploy then ship the previous code. Never point staging at production data.

## 6. Versioning strategy

EscapeSnap uses **Semantic Versioning** (MAJOR.MINOR.PATCH). Releases are git tags on `main`; the current release is **v1.0.0** (20 October 2026). The earlier `Beta` tag (30 August 2026) marks the beta release.

| Bump              | When                                                                                                                      | Example                                                      |
|-------------------|---------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------|
| **MAJOR** (2.0.0) | A change that breaks existing data or clients: a schema change needing migration, a renamed Method, or changed game rules | Replacing letters with a new final-puzzle format             |
| **MINOR** (1.1.0) | A backwards-compatible feature                                                                                            | Typing / random answer modes (#98), translation helper (#99) |
| **PATCH** (1.0.1) | A bug fix or copy change with no new behaviour                                                                            | Fixing a reconnect edge case                                 |
| **Pre-release**   | Builds handed to testers before a release                                                                                 | `v1.1.0-beta.1`                                              |

1.  Only tag a commit on `main` whose CI and deploy runs are green.
2.  Use annotated tags so the tagger and date are recorded: `git tag -a v1.1.0 -m "v1.1.0"`, then `git push origin v1.1.0`. (`Beta` and `v1.0.0` are lightweight tags with no tagger.)
3.  Publish a GitHub Release from the tag with *Generate release notes*, which lists every merged PR since the last tag.

## 7. Pull request strategy

This replaces the Milestone 3 `[Role] [Task ID]` commit prefix. CI no longer checks branch or commit names, so reviewers enforce these conventions.

1.  **Issue first:** every change starts from an issue on the project board, assigned and moved to *In Progress*.
2.  **Branch** from an up-to-date `main` using a lowercase `feature/`, `fix/`, `test/` or `docs/` prefix plus a short kebab-case name, e.g. `feature/randomised-modes`. Capitalised prefixes such as `Feature/…` are not used.
3.  **Commits** start with the issue number and an imperative summary: `#81 add flag language picker`. When two people work together, add `Co-authored-by: Name <email>` so both get credit.
4.  **Before opening the PR:** merge the latest `main` into your branch and run `meteor npm run lint` and `meteor npm test` locally.
5.  **Open the PR** with the template: title `#<issue> <summary>`; body containing `Closes #<issue>`, what was tested, and screenshots for UI changes.
6.  **Review:** at least one approval from someone other than the author, including at least one substantive comment (a question, risk or suggestion, not just "LGTM"). Rotate reviewers across sub-teams; the CI gate check must pass.
7.  **Merge** with *Squash and merge* so `main` gets one commit titled with the issue reference, then delete the branch (turn on *Automatically delete head branches*).
8.  **After merge:** check the deploy run and the live site, then move the card to *Done*.

### Merge ordering

- Large cross-cutting PRs (the \#128 redesign, \#122 team-vs-team) touch most UI files. Announce them in the team chat and merge them either early in the sprint or after the smaller PRs, not in the middle.
- Stack dependent work explicitly: base the branch on the parent branch (e.g. typing mode on the drawing-mode branch) and retarget it to `main` once the parent merges.
- Schema changes merge before the UI that uses them, and new fields are optional so live games still validate.

## 8. Known issues and notes

### Resolved since Milestone 3

- **Lint and deploy not gated.** Fixed: deploy only runs after a fully green CI run, and lint fails CI.
- **Game deadlocked when a player left (UAT \#103).** Fixed by the host override (#101), reconnect (#115) and presence/rejoin (#122, \#131): a disconnected player has 2 minutes to rejoin, and a player who leaves has their riddles handed to teammates.
- **Hard-coded event log (UAT \#102).** Replaced by the live event log (#117).
- **One phone could act as another player.** Join, rejoin and leave now issue and check a per-player session token (#126).

### Open issues and gotchas

- **Unmerged work:** typing and random answer modes (#98) have not been pushed to the repository; `main` only has the camera and drawing modes (`imports/lib/answerModes.js`). The translation helper (#99, `feature/english-translation-helper`) is not on `main` yet. Load testing (#52) has not started.
- **Host cannot play:** the host screen only spectates. Workaround: the host also joins from their own phone as a player.
- **Team size:** 2–4 players per team (create form); larger groups should use a team-vs-team match.
- **Riddle prompt edge cases:** riddle answers must come from the COCO object list (`imports/lib/cocoClasses.js`) because that is what Gemini verifies well. Custom themes outside that list produce weak riddles, and final answers are limited to 3–12 letters. Without a Gemini key the small built-in bank repeats quickly.
- **Gemini quota:** free-tier keys hit 429/503. The client cools a failing model down for 60 s and tries the next; if all fail, riddles fall back to the bank and photo checks return an error the player can retry.
- **Session edge cases:** a player is identified by browser storage. Clearing it, switching browser or using private mode means they cannot rejoin as themselves. Disconnected players are dropped after 2 minutes, and games are ended by the expiry sweep 5 s after their timer runs out.
- **Camera:** needs HTTPS (see Prerequisites).
- **Origin check:** in production the server closes DDP connections whose browser origin is not `ROOT_URL` (`server/main.js`). Moving to a custom domain means updating `ROOT_URL`, or every client will fail to connect.
- **Localisation gaps:** the riddle-theme labels on the create-game page are still hard-coded in English.
- **Infrastructure:** staging is not configured (#127) and the Galaxy sandbox is a single small container (see the Maintenance Plan). Dependabot PRs (#129, \#130) are waiting for review.
- **Process:** several Milestone 4 issues were left open after their PRs merged; use `Closes #N` in PR bodies so GitHub closes them automatically.

## 9. Troubleshooting

| Symptom                                                       | Fix                                                                 |
|---------------------------------------------------------------|---------------------------------------------------------------------|
| Camera says it needs a secure connection                      | Open the app on localhost or the HTTPS deployed URL, not a LAN IP.  |
| "Photo verification is not configured"                        | Set `GEMINI_API_KEY` in `.env` and restart.                         |
| Playwright: "port 3000 is already used"                       | Stop `meteor run`, or set `E2E_PORT=3100`.                          |
| `npm run test:unit`: bad option `--experimental-default-type` | Run through `meteor npm`, or use `node --test <files>` on Node 23+. |
| Need to inspect the local database                            | `mongosh mongodb://127.0.0.1:3001/meteor` while the app runs.       |

## 10. Team

| Name                                | Email                       | Name                                | Email                       |
|-------------------------------------|-----------------------------|-------------------------------------|-----------------------------|
| Youssef Ahmed Adel Attia Hassanein  | yahm0006@student.monash.edu | Dylan Gorgioski                     | dgor0011@student.monash.edu |
| Abdullah Wael Abdelazim Ahmed Salem | asal0064@student.monash.edu | Kayvis Goh                          | zgoh0013@student.monash.edu |
| Casiebelle Le                       | clee0132@student.monash.edu | Udayan Mishra                       | umis0001@student.monash.edu |
| Prem Veer Reddy Chanumalla          | pcha0097@student.monash.edu | Sebastian Gracious Pullanthyanickal | spul0008@student.monash.edu |
| Awanish Gazmer                      | agaz0007@student.monash.edu |                                     |                             |