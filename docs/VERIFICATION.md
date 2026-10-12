# Verification record

## Status

Cookie-session architecture implemented (Java issues HttpOnly cookies; the Node BFF was removed) and the frontend refactored into vertical slices. Not committed, awaiting owner review. The live browser/Docker check against the rebuilt containers has **not** been run yet.

## Executed (2026-10-11)

Backend (`../backend`, JDK 25 in WSL): `./mvnw verify` — 130 unit tests + 56 integration tests pass, including the new `SessionControllerIT` (HttpOnly cookies and no tokens in body, cookie auth on `/me`, stale cookie on login, CSRF and Origin enforcement, refresh rotation + replay revocation, logout without access cookie, bearer clients unaffected) and `AuthenticationServiceTest` for `logoutWithRefresh`. JaCoCo service coverage gate passes.

Frontend: `npm run typecheck`, `npm run lint`, `npm test` (39 tests: pages, validation, failure mapping, client/service cookie flow including 401 → refresh → retry and cross-tab skip, link-token scrub), `npm run build` — all pass. Tests use mocked `fetch`/ports and prove no live integration.

## Not verified

- Live Chromium run against the rebuilt backend + nginx containers (login, reload, silent refresh after 5 min, two tabs refreshing concurrently, logout clearing cookies).
- Physical screen readers, 200%/400% zoom, Safari/Firefox, mobile devices, production TLS (`taxi.session.secure` defaults to true; only the `dev` profile sets false).

## Known behavior

- Refresh replay revokes the whole session; the SPA serializes rotation with a Web Lock, but a second device logging in still ends the first (one active family per account).
- Reset/invitation links cannot distinguish expired/used/replaced (backend returns one 401).
- Access tokens already issued remain valid until expiry (≤5 min) after logout in another tab.
