# Taxi backoffice

Login, forgot-password and reset/set-password screens, plus the administrator **Accounts** screen (`/accounts`): searchable/filterable list, guided create, edit, deactivate, delete and resend invitation against `/api/v1/accounts`. Other sidebar modules are shown as unavailable.

## How auth works

React talks only to the Java API (`/api/v1/auth/*`, same origin). The Java API issues the JWTs as **HttpOnly cookies**; JavaScript never sees a token.

- `POST /api/v1/auth/session` logs in and sets `taxi_at` (access, 5 min) and `taxi_rt` (refresh, 7 days), both HttpOnly + SameSite=Strict (+ Secure outside local dev).
- Unsafe requests first call `GET /api/v1/auth/session/csrf` and echo the value in `X-CSRF-Token` (double submit); the API also checks `Origin` against `taxi.session.origins`.
- Reload restores the session through `GET /api/v1/auth/me`. On 401 the SPA rotates cookies once through `POST /api/v1/auth/session/refresh` (single-flight, plus a cross-tab Web Lock because refresh tokens are single-use).
- Logout (`POST /api/v1/auth/session/logout`) always clears the cookies; revocation is best effort when the refresh cookie is valid.
- The existing bearer API (`/api/v1/auth/login|refresh|logout`) is unchanged for non-browser clients.

Contract and security notes: `../backend/REST_AUTH.md`.

## Run

Needs Node >=22.12 and the backend on `127.0.0.1:8080` running with the `dev` profile (it allows the `http://localhost:3000` origin and non-Secure cookies).

```sh
npm ci
npm run dev        # http://localhost:3000, /api proxied to 127.0.0.1:8080
```

Routes: `/accounts` (ADMIN only; filters and page live in the query string), `/login`, `/forgot-password`, `/reset-password#token=…`, `/set-password#token=…`, `/authenticated` (guarded).

## Checks

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Vitest/Testing Library use synthetic fixtures and mocked `fetch`; they do not prove live integration. Backend: `cd ../backend && ./mvnw verify`.

## Docker

`Dockerfile` builds the SPA and serves it with nginx on `3000`; `nginx.conf` proxies `/api/` to `backend:8080` so the browser stays same-origin (no CORS).

```sh
docker compose -f ../compose.yaml build backoffice
docker compose -f ../compose.yaml up -d --no-deps --wait backoffice
```

## Structure

- `src/App.tsx`, `src/main.tsx`: composition root (session provider + routes) and entry.
- `src/auth`: vertical slice. `domain/{models,clients,services,mappers}` (API calls, session/validation logic, status-to-failure mapping); `ui/{pages,components,assets}` (one page per screen, form hooks, Bulgarian copy).
- `src/common`: shared slice (layout shell, labelled fields/password toggle, global styles and theme).
- `src/tests`: all tests, mirroring `src` by slice, named `<Subject>.test.ts(x)`.
- `nginx.conf`: static hosting, SPA fallback, `/api/` proxy, CSP.

## API validation errors in forms

`ApiClient` reads the `errors` of a 400 problem body into `ApiError.violations`, and `toApiFailure` passes them on as `ApiFailure.violations`. To show them beside the inputs a form only declares a field map (request field to form field, e.g. `rides/domain/models/RideRejectedFields.ts`) and optional wording, then calls `useRejectedFields({ failure, fieldMap, order, ids, messages })`. The hook picks the reason per field, falls back to the shared wording in `common/ui/assets/copy.ts` (`violationText`), focuses the first refused field and drops a refusal when its field is edited (`dismiss`). Rides, cars and accounts forms use it.

## Address search

Address fields (`common/ui/components/AddressAutocomplete`) propose Bulgarian addresses from Google Places API (New) over REST, 500 ms after the user stops typing, with Dimitrovgrad ranked first (a bias, not a restriction). Picking a proposal also fetches its coordinates, which are saved with the ride. Setup, restrictions of the key and the tunables are in `.env.example`; without `VITE_GOOGLE_PLACES_API_KEY` the fields are plain inputs. The provider is isolated in `common/domain/clients/GooglePlacesClient.ts` (port: `AddressSearchClient`); the CSP in `nginx.conf` allows only `https://places.googleapis.com` for it.

No remote fonts or scripts, analytics, tokens in browser storage or public registration. The only third-party request is the address search above, and only when a key is configured.
