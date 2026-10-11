# Verification and partial handoff — t_3cd4c379

## Status

Runnable React auth foundation and Docker runtime implemented. NOT complete authentication integration and NOT ready for final acceptance. The owner may inspect this code now, but the formal owner code-review gate still applies after integration is finished; no Accounts/internal-system work is authorized.

Source: /mnt/e/projects/taxi/backoffice, branch review/auth-foundations. Backend untouched at 9d322ddc953b0442b57366bc5c98211467f161e4. Root compose.yaml is outside this new frontend repository; docs/root-compose.patch preserves its exact additive change (reverse apply check passed). No parent repository initialized, no merge/publish/deploy.

## Implemented

- React 19.3.0, TypeScript 6.0.3, Vite 8.3.4, React Router 8.4.0; exact npm dependencies and lockfile.
- Bulgarian copy, replaceable brand, approved dark auth split/stacked layout and semantic tokens. Reusable labelled fields, current/new password autocomplete, Show/Hide, first-invalid focus, error focus, pending guards, reduced-motion spinner.
- Login, recovery request/conditional confirmation, reset/set presentation, success/return-to-login, missing-link recovery, generic invalid-link and conflict/uncertain outcome handling. Private route limited to identity confirmation/logout.
- Typed injectable AuthPort. Default fails closed with explicit integration-pending feedback; no fabricated success or API requests. Success/failure UI transitions tested with synthetic ports only.
- Two-stage image: pinned Node 24 build, pinned nginx runtime, UID/GID 101, port 3000. SPA fallback and /api reverse proxy to backend:8080 using Docker DNS. No Vite runtime proxy dependency. No access logs, no secrets baked in.
- Added only backoffice service to existing compose.yaml, published 127.0.0.1:3000:3000. Existing backend/Mongo/legacy Mailpit preserved, no volume operations. ./taxi inspected, unchanged; README gives frontend-only Compose commands.

## Executed commands and outcomes

- npm install / npm install --save-dev: succeeded; audit reported 0 vulnerabilities (not an independent security scan).
- npm ci: PASSED, 236 packages added / 237 audited. First attempt while Vite was running failed ENOTEMPTY on node_modules/.vite; stopped our Vite process and clean retry passed.
- npm run typecheck: PASSED.
- npm run lint: PASSED.
- npm test: PASSED, 20 tests. Earlier run exposed two logout-feedback race failures, corrected and rerun successfully. Coverage includes login success/failure, short existing password, secret clearing, first invalid focus, Show/Hide, pending duplicate guard, anti-enumeration confirmation, reset AND set success/missing link, 401/409/503/transport same-link freeze, local-only logout, byte policy and 400/403/413/429 mappings. No refresh implementation/test yet.
- npm run build: PASSED; Vite production bundle generated.
- npm run dev: Vite ready on 127.0.0.1:3000. Stopped our process to free port for Docker.
- docker compose -f ../compose.yaml config --quiet: PASSED.
- docker compose -f ../compose.yaml build backoffice: PASSED, real multi-stage build including independent npm ci and production build.
- docker compose -f ../compose.yaml up -d --no-deps --wait backoffice: PASSED, healthy. Orphan warning refers to preexisting legacy Mailpit/mongo-init; neither removed.
- curl localhost:3000/login -> 200; /reset-password -> 200; /api/auth/me -> 401 {code:UNAUTHENTICATED}. This verifies runtime proxy backend connectivity, not successful authentication.
- docker compose exec backoffice id -> uid=101(nginx) gid=101(nginx).
- Existing backend health UP; Mailpit HTTP 200. Backend source git status clean.
- python3 scripts/check-public-api.py: PASSED against real local HTTP. Missing login payload 400 INVALID, unknown login 401 UNAUTHENTICATED, unknown recovery 202 conditional message, invalid reset 401, invalid refresh 401. Evidence live-public-api.json.
- python3 scripts/check-live-api.py --documented-dev-seed: BLOCKED at login, expected 200 got 401. No account created, no seed reset or guessed credentials. Successful login/me/refresh/logout, eligible recovery/reset and captured-mail consumption remain unverified.
- Local Playwright and browser tool could not launch Chromium: host missing libnspr4.so. Alternative isolated image mcr.microsoft.com/playwright:v1.64.0-noble succeeded against real built nginx UI via taxi-local_default network.
- docker run --name taxi-auth-ui-check --network taxi-local_default -v /mnt/e/projects/taxi/backoffice:/work -w /work -e UI_BASE_URL=http://backoffice:3000 mcr.microsoft.com/playwright:v1.64.0-noble node scripts/check-ui.mjs: PASSED. Widths 320/390/768/1024/1440; no horizontal overflow or page errors; Tab/Shift+Tab/Enter/Space validation/reveal passed. Screenshots for login/forgot/missing-reset at each width. Named test container is exited (automatic removal was blocked by tool policy); runtime service remains running.
- Inspected desktop and 320px screenshots visually: layout, label visibility, wrapped Bulgarian copy, reachable controls. Platform font rendering differs from Windows reference; no pixel-perfect equivalence claim.

## Remaining blockers / decisions

1. Q07/Q09: explicit agreement requested on the card for tab-memory-only tokens (reload requires login), isolated tabs, single-flight refresh/discard on uncertain failure, localhost:3000 same-origin /api and fragment capture/scrub lifecycle. Owner runtime requirement now explicitly establishes container port/proxy boundary, but does not approve session persistence UX. No dependent adapter policy silently assumed.
2. Valid authorized local test access: documented development fixture returned 401. Operator can supply a dedicated eligible synthetic account with captured invitation or authorize a secure credential path. Do not put passwords/tokens in card comments or chat. No resetting the operator's seed password without authorization.
3. Once agreed: implement HTTP/session adapter, real fragment parsing/cleanup and refresh-loss UI; add transport/session race and refresh-failure tests; run successful auth, recovery and captured-email flows through frontend and Docker proxy. Runtime currently truthful UI foundation only, not working end-to-end auth.
4. Physical keyboard/screen reader, 200% text/400% zoom, IME/software keyboard, Safari/Firefox and physical devices not verified. No native Android/iOS claims.

See docs/auth-integration.md for precise verified HTTP boundary and unagreed proposals. docs/auth-integration-discovery.md is preserved historical discovery, not current status.
