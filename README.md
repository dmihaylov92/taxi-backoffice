# Taxi backoffice — auth foundation

Partial implementation for t_3cd4c379; NOT ready for acceptance or production. No Accounts/internal-system screens are implemented. Owner code review is required before that next phase.

## Run

Use Node >=22.12 and npm (tested host Node 26 / npm 11; Docker Node 24).

```sh
cd /mnt/e/projects/taxi/backoffice
npm ci
npm run dev
```

Open http://localhost:3000/login. Other routes: /forgot-password, /reset-password, /set-password. Reset/set without a acquired token show missing-link recovery. /authenticated is guarded and only a minimal confirmation, not a dashboard.

Important: the UI's default AuthPort deliberately fails closed while Q07/Q09 session/origin/link decisions await agreement. The running app does NOT fake successful authentication or emails. Success and server-error screen behaviors are exercised with explicitly mocked ports in component tests. Real transport, session refresh and fragment acquisition are not enabled. See docs/auth-integration.md.

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Vitest + Testing Library tests use synthetic fixtures. Tests do not prove backend integration. `scripts/check-public-api.py` exercises real public HTTP contract errors against the existing local backend. `scripts/check-live-api.py --documented-dev-seed` attempts the documented development fixture, provisions ONE synthetic account, exercises invitation/reset/auth lifecycle and leaves that fixture disabled; it never changes the seed password. Do not run against production. Current attempt stopped at seed login HTTP 401; no fixture created. A valid authorized test account is still needed.

## Docker (existing project stack)

The root launcher explicitly uses ../compose.yaml; a backoffice service has been added there, without changing backend/Mongo or the separately running legacy Mailpit container. Launcher currently accepts backend/mongo/all only, so use these precise commands for frontend-only work:

```sh
docker compose -f ../compose.yaml config --quiet
docker compose -f ../compose.yaml build backoffice
# Existing backend is already healthy; do not recreate it or stop SMTP.
docker compose -f ../compose.yaml up -d --no-deps --wait backoffice
```

Stop `npm run dev` first to free port 3000. Multi-stage Dockerfile uses Node to build and unprivileged nginx to serve static assets on container port 3000. Host binding is 127.0.0.1:3000:3000. SPA deep links fall back to index.html; /api goes to backend:8080 through Docker DNS, NOT Vite or container localhost. No credentials are baked in; access logging is off. Runtime is local-development scope, not a production deployment approval.

Browser check (isolated Playwright image because host lacks libnspr4):

```sh
docker run --rm --network taxi-local_default \
  -v /mnt/e/projects/taxi/backoffice:/work -w /work \
  -e UI_BASE_URL=http://backoffice:3000 \
  mcr.microsoft.com/playwright:v1.64.0-noble node scripts/check-ui.mjs
```

Reports/screenshots live under docs/evidence. Headless keyboard events are not physical keyboard, screen-reader, mobile-device or full WCAG conformance evidence.

## Structure

src/auth: Bulgarian copy/configured branding, typed UI port, validation/error mapping.
src/components: shared layout and labelled fields/password toggle.
src/App.tsx: public route/form transitions and guarded authenticated confirmation.
src/styles.css: approved semantic tokens and responsive auth layouts.
.design-reference: preserved recovered design archive, ignored by Git and Docker.

No remote fonts, analytics, credential persistence, public registration, Accounts UI or backend changes.
