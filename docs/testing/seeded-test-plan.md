# EscapeSnap repeatable test plan

## What is implemented

Four areas now have added or expanded automated coverage:

1. Team badge calculation and persistence.
2. AI riddle generation and photo verdict handling.
3. Round submissions, team progression, and shared hint penalties.
4. Final-answer attempts and win/loss results.

The tables below distinguish automated checks from browser checks still to implement. A database assertion does not prove a badge is visible on a screen. No browser automation suite is included in this change.

## Repeatable setup

- Shared fixture: `imports/api/testing/seededScenario.js`.
- Round riddle: **I hold your drink and have a handle. What am I?**
- Object: **cup**. Hint: **Look beside the kettle.**
- Final riddle: **I open a lock. What am I?** Answer: **KEY**.
- Meteor seed: `imports/api/testing/seedGame.js`, game `seed-game`, code `4242`, team `Seed Team`, players `seed-ada` / Ada and `seed-grace` / Grace.
- Three rounds per player, ten-minute shared timer, easy classroom game.
- The seed inserts a ready-made riddle pool, bypassing generation, and calls the actual `rounds.createForGame` method. Every assigned riddle is the same cup riddle. Assigned letters wrap through KEY.
- Each Meteor scenario resets its test collections and builds fresh fixtures. The helper refuses to run unless `Meteor.isTest` is true. It is not exposed as a remote method.
- Unit tests use explicit timestamps; Meteor expiration tests backdate the game, avoiding ten-minute waits. The Meteor seed uses the current start time so unexpired action tests do not depend on the calendar date.
- AI unit tests replace server `fetch` with exact Gemini-shaped responses, restore it after each test, and use a dummy API key. They never contact Gemini. Pass means the stub returns `{"outcome":"pass","explanation":"Seeded verdict"}`; fail returns the equivalent fail verdict. Error cases inject HTTP failure, invalid JSON, missing content, network failure, or AbortError.
- The photo string in unit tests is a payload fixture, not a real JPEG. These tests verify request/response handling, not the model's recognition quality.

### Commands

```sh
npm ci
npm run test:unit
npm run test:meteor
# Both suites:
npm test
```

Use Meteor 3.4.1 and its supported Node runtime (`meteor npm` if necessary). Run database tests against Meteor's temporary test database or an explicitly disposable `MONGO_URL`; tests reset collections. Do not point them at development data you want to keep.

The Meteor test command clears `GEMINI_API_KEY`, so existing game-creation tests use the offline fallback without making live AI calls. The new seeded method tests bypass generation entirely.

Node-only files use `.unit.js` and are listed explicitly in `test:unit`. Meteor discovers `.test.js`. This keeps Node test hooks and global fetch mocks out of the Meteor runner. The existing CI invokes `npm test`, so the added suites are included.

## 1. Team badges and results

Automated files: `calculateGameResults.unit.js` and `games/finalAnswer.test.js`.

| Case | Setup / action | Expected assertion | Coverage |
|---|---|---|---|
| Participation | Complete a mission with zero correct rounds | Every player gets Field Operative; no competitive badge | Automated |
| Fastest solve | Ada solves faster than Grace | Ada receives Lightning Solver | Automated |
| Most correct | Ada gets three correct, Grace one | Ada receives Riddle Master | Automated |
| Perfect game | Ada completes all three correctly | Flawless Agent and 100% accuracy | Automated |
| Incomplete game | One correct and a pending round | No Flawless Agent; pending excluded from completed count | Automated |
| First solve | Ada submits the first correct answer | First Breakthrough belongs to Ada | Automated |
| Tied winners | Equal solve counts and times | All tied players receive competitive badges and equal rank | Automated |
| Clutch boundary | Submit at 539999, 540000, 600000, 600001ms of a ten-minute game | Badge only from 540000 through 600000 inclusive | Automated calculation; not a claim server accepts at expiry |
| Hint-adjusted clutch | Deduct 60000ms, submit at 485999 and 486000ms | Window begins at 486000ms; qualifying metric is 54000ms remaining | Automated |
| Invalid timing | Missing/reversed round timestamps | No fastest-time badge from invalid durations | Automated |
| Ranking tie break | Same correctness, different average solve times | Faster average ranks first | Automated |
| Empty team | No players or rounds | Empty results without error | Automated |
| All six together | Ada solves at offsets 10s, 20s, 550s, each in 5s; Grace remains pending | Ada has all six badges and rank 1; Grace only participation and rank 2 | Automated database |
| Save twice | Finalize the same seeded game twice | Exactly one result per player, two records total | Automated sequential database |
| Visual identity | Inspect badge definitions | Each badge has a distinct color and shape | Automated data |
| Team screen rendering | Load the completed all-six fixture and open team/results screen | Correct player row shows six icons, names/metrics match saved data; Grace has only participation | Browser pending |
| Reload / navigation | Reload team screen and return from another tab/page | Same badge set and ranking, no duplicates | Browser pending |
| Empty/loading/error | Delay result publication, then publish empty results | Loading and empty states are readable; no stale badges from another game | Browser pending |
| Mobile / accessibility | Use a narrow viewport; focus/tap badge details | No clipped badges; descriptions accessible without relying on color | Browser pending |
| Cross-game isolation | Seed a second game with different winners | Team view displays only selected game's players/results | Browser and publication tests pending |

### How to set up the badge screen test

For a future browser suite, run a dedicated full test app with one host context and two independent player contexts. Add a server-only full-test fixture module that inserts the same players/riddles and completed round timestamps, then calls `finalizeGameResults`. Gate any browser-accessible reset endpoint with `Meteor.isAppTest` and keep it out of normal builds. The current `seedGame` helper is for method tests and deliberately cannot be called from a normal browser session.

Open the actual team/results route for that game. Scope assertions to each player's row, not the whole page: six badges for Ada, participation only for Grace, correct ranks and metric descriptions. Reload and repeat. A second browser scenario should play through the seeded mission before checking results, to prove the UI-to-method-to-publication flow.

## 2. Riddles and AI photo checks

Automated files: `riddles/geminiClient.unit.js`, `submissions/classifyWithGemini.unit.js`.

| Case | Setup / action | Expected assertion | Coverage |
|---|---|---|---|
| Fixed generation | Return cup fixture twice from Gemini stub | Identical riddle text, answer and hint both times | Automated |
| Theme schema | Inspect outgoing generation request | Allowed object enum includes cup | Automated |
| Invalid objects | Mix cup, dragon, null and incomplete entry | Only valid cup riddle survives | Automated |
| Empty pool | Return no valid riddles | Generation rejects so caller can use fallback | Automated rejection; fallback integration pending |
| Zero requested | Ask for zero rounds | Empty array; no request | Automated |
| Final normalization | AI returns k-e-y | Stored answer KEY | Automated |
| Wrong answer length | Return LOCK, then KEY for three letters | Retry and accept KEY | Automated |
| Repeated wrong length | Return LOCK every time | Stop after three attempts | Automated |
| Generation timeout | First fetch raises AbortError, second returns cup | Retry once and return fixture | Automated injected error |
| Quota error | Return HTTP 429 | Reject without timeout retry | Automated |
| Correct photo | Stub pass; send fixed photo payload and cup target | Exact payload sent, pass and explanation returned | Automated adapter |
| Incorrect photo | Stub fail | Fail and explanation returned | Automated adapter |
| Missing API key | Remove key | Configuration error without request | Automated |
| Service failures | 503, malformed JSON, empty content, unknown outcome, offline, AbortError | Retryable error response, never accidental pass | Automated |
| Capture accepted | Fake camera frame + server pass stub; click capture | One correct round, one letter, success screen | Browser pending |
| Capture rejected | Fake frame + server fail stub | Rejection feedback, no correct letter; verify intended retry/skip behavior | Browser pending |
| Fail then pass | Queue server fail then pass; capture twice | Both attempts saved; only accepted attempt awards letter | Browser + storage integration pending |
| Camera denied/missing | Reject getUserMedia with NotAllowedError / NotFoundError | Clear message; capture disabled | Browser pending |
| Upload boundaries | Missing/oversize payload at submissions.classify | Error, no model call, no stored attempt | Method integration pending |
| Generation unavailable | Stub both generators to fail | Game still starts with theme-compatible fallback pool | Method integration pending |
| Slow generation race | Delay prewarm until fallback starts game | Late AI response cannot overwrite dealt riddles/letters | Method integration pending |

### How to seed the photo journey

Use a committed cup-image/video fixture with a fake browser camera, or inject a MediaStream from a fixture canvas in the test harness. This exercises capture and base64 conversion. Stub the **server's** Gemini request, since browser HTTP interception cannot see a server-side request. Keep actual `submissions.classify`, persistence, and `rounds.submit` active. Queue pass/fail/error per scenario, reset the queue each test, and fail on unexpected calls. Assert the UI, round document, player letter array, and submission record together.

A mocked pass proves the application's handling of acceptance. Run separate optional live-model checks with real cup/non-cup images to assess recognition; those should not decide the deterministic CI result.

## 3. Rounds, hints, shared timer

Automated file: `rounds/roundsMethods.test.js`.

| Case | Setup / action | Expected assertion | Coverage |
|---|---|---|---|
| Seed dealing | Seed two players and three rounds | Six cup riddles; only round one has start timestamp | Automated |
| Correct submission | Ada submits true | Assigned letter once; status correct; duration nonnegative | Automated |
| Wait for team | Ada finishes while Grace remains pending | Game stays on round one | Automated |
| Last teammate skips | Grace skips after Ada succeeds | Grace gets ?; both enter round two with start timestamps | Automated |
| Duplicate submit | Submit same round twice | invalid-state on second call; one letter | Automated |
| Concurrent submit/skip | Fire both against the same round | Exactly one settled outcome and matching letter | Automated |
| Expired submit | Backdate game beyond ten minutes | timeout status/error; ? only | Automated |
| Repeated hint | Two concurrent hint calls for same round | Same hint; one 60000ms charge total | Automated |
| Different players' hints | Reveal each player's hint | Shared penalty accumulates to 120000ms | Automated |
| Refresh timer | Repeat markStarted | Original timestamp preserved | Automated |
| Missing round | Submit, skip, hint on unknown ID | not-found | Automated, three cases |
| Hint affects all screens | Open host and two players; reveal one hint | All clocks lose one minute, including after reload | Browser pending |
| Hint exhausts clock | Seed <60s remaining; reveal hint | Expired state everywhere; capture cannot succeed | Browser + method integration pending |
| Round waiting screen | Finish Ada first, then Grace | Waiting count changes; both show same next round | Browser pending |
| Host force advance / last round | Leave attempts pending, advance as host | Defined forfeit behavior including final round | Regression pending; disconnect branch changes this |
| Disconnect/reconnect | Drop a real player connection, restore within/beyond grace period | Presence and progression follow intended grace-period rules | Pending on main; additional tests exist on disconnect branch |

## 4. Final answer and endgame

Automated file: `games/finalAnswer.test.js`.

| Case | Setup / action | Expected assertion | Coverage |
|---|---|---|---|
| Correct normalized answer | Submit `  key  ` | Win, endedAt set, results saved for both players | Automated |
| Incorrect guesses | Submit WRONG three times | Attempts left 2, 1, 0; game only loses on third; results only then | Automated |
| Last-chance win | Wrong, wrong, KEY | Win on third attempt | Automated |
| Submit after finish | Win, then submit again | invalid-state; saved results and attempt count unchanged | Automated |
| Win/loss routing | Submit from host with two player views open | Every view reaches matching endgame state | Browser pending |
| Attempt feedback | Enter wrong answers through form | Accurate remaining count; third attempt ends mission | Browser pending |
| Repeat click/race | Send simultaneous final guesses | One terminal outcome, consistent attempts and results | Concurrency regression pending |
| Empty/malformed/expired guess | Exercise invalid values and expired game | Agree expected validation first, then enforce at method and UI | Pending product rule / regression |
| Final results navigation | Open leaderboard, summary, then return | Same team result and badge data | Browser pending |

## Other features worth covering next

- Lobby: invalid/blank/long names, invalid code, full capacity, game already started, host start before full, simultaneous joins, refresh/rejoin identity.
- Photo gallery: pass/fail attempt order, grouping/filtering, missing/expired photos, storage-size cutoff, six-hour expiry, isolation between games.
- Sharing: win/loss card fields, player/team selection, image export, clipboard/share unavailable fallback, mobile layout.
- Languages: switch while playing, persistence after reload, missing translation fallback, Arabic direction/layout, translated validation messages.
- Publications: unknown game/player IDs, loading/subscription lifecycle, and fields clients should not receive.

These are backlog items, not claims of implemented coverage. In particular, `rounds.submit` currently takes the client's correctness boolean; a mocked classifier unit test does not prove server-side enforcement of photo acceptance. Add a regression for bypassing classification when tightening that flow.

## Verification for this change

- 32 Node unit tests passed.
- 32 Meteor server tests passed (including 17 new seeded method tests).
- Browser scenarios above remain planned, not executed.
