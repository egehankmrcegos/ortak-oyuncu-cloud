<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Game writes go through server functions in src/lib/game.functions.ts using the admin client with per-player token checks; room state is read through the token-checked getRoomState server function (polled), never directly from the browser. Why: no accounts, and secret team picks must stay hidden until both are in.
- Keep Capacitor as a separate native shell with dynamically loaded plugins; never put server credentials or SSR output into its web assets. Why: the web game remains edge-hosted and native bundles cannot execute server functions.
- Treat remote-server Capacitor builds as prototypes and fail the release preflight until a bundled native game client is implemented. Why: Capacitor documents server.url as development-only and Apple may reject website wrappers.
- Require versioned game privacy acknowledgement, expose privacy/support, and clear only game-prefixed storage. Why: the no-AI data flow must be clear without erasing unrelated data.
- Normalize invitation codes through the shared room-code parser at routes, inputs, and server validation; share URL-only invitations and recover only explicit matching invitation text. Why: mobile sharing can append descriptions to links, which must never become room codes or raw validation errors.
- Select secret-team choosers through the pure round-robin scheduler in game-rules.ts; flatten all pairs before repeating. Why: fixed strides omit pairs in even-sized rooms.
- Judge only sourced positive catalogue/cache records and return an unverified error without scoring unknown answers; do not invoke AI. Why: incomplete coverage must not reject genuine players or consume AI credits.
- Normalize team picks using the shared pure team-names module before storing them; accept exact aliases and unique literal prefixes of at least five characters, preserve ambiguous or unfamiliar names for sourced validation, and never fuzzy-repair partial prefixes. Why: recognizable abbreviations should work without inventing clubs.
- Reserve answers and record verdicts through room-locked RPCs; use latest-wrong eligibility before the final window and one reserved final submission per eligible player during it. Why: concurrent calls must not bypass waiting, deadlines, or scoring.
- The stored final-window deadline includes a ~2s delivery buffer over the visible countdown (clamped client-side). Why: polling latency made the timer appear late.
- Persist final-window deadlines and advance rounds atomically from token-checked polling after accepted answers resolve; keep the round-robin ordering in the transition RPC aligned with choosePair. Why: all devices share the timer and a timely answer must be judged before a timeout advances the round.
- Players pass via the room-locked pass_round RPC (per-round passed list); when every player has passed the round advances to picking. Why: concurrent passes must count once.
- Keep shared presentation and bundled stadium imagery in GameShell with semantic CSS tokens; keep game actions and polling in their existing routes unchanged. Why: visual redesigns must not alter multiplayer rules or state transitions.
- Manage the visual viewport in the shared GameShell hook after hydration, with safe-area CSS and keyboard-only compact layouts; never disable pinch zoom. Why: Safari and WKWebView keyboards must not cover controls or alter multiplayer logic.
- Render stadium artwork below viewport-sized home and game content; move long answer histories and match reports into GameDetails dialogs, with a subdued separated pass action and a primary answer action. Why: game controls must remain visible without page scrolling or accidental passes.
- Validate picks against the supported catalogue server-side and choose random pairs with positive shared-player evidence. Why: offline judging must not generate unsupported random rounds.
- Persist skipped-round suggestions on the room and generate them only after two distinct players have wrong attempts, with a revealing state and conditional round updates. Why: all players must see the same sourced answers without awarding points or leaking them during play.
- Capture round outcomes through the match_rounds room-update trigger and return current-match attempts only through token-checked finished-room polling. Why: every transition is recorded atomically without exposing active or previous-match answers.
- Choose random clubs from difficulty-specific familiar-club pools and commit them through the room-locked set_random_teams RPC during polling; exclude all current-match picks. Why: every device shares one pair and no club repeats, even when rounds auto-advance.
- Keep open football data in a separate provenance-bearing staging catalogue; only reviewed first-team appearance evidence can become judging input, and pending or missing records must never reject answers. Why: free membership datasets are incomplete and do not establish official appearances.
- Rebuild the compact server-only catalogue with scripts/build-football-catalog.py (club list in scripts/football_clubs.py, audit in data/football); require Wikidata senior-club membership plus a DBpedia station since 1985 with positive league caps; keep the full build output outside the repo. Why: extraction agreement is auditable, not full coverage.
- Expose only supported club names in the browser-safe team list; keep careers and positive judging evidence server-only. Why: team input can be discoverable without leaking answers.
- Persist private room-scoped reports and blocks, enforce text filtering on the server, and anonymize deletion under a room lock. Why: client hiding alone cannot enforce privacy or game safety.
- Run bounded retention through a daily managed authenticated callback. Why: stale room records must be removed even when nobody opens the app.
- Solo training: stateless catalogue judging via the public game API. Why: single-device review, no data stored.
