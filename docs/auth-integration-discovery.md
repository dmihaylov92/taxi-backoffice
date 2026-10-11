# Authentication integration discovery — t_3cd4c379

Status: prerequisite discovery only; NOT an agreed integration contract or implementation handoff. Authentication implementation and verification remain outstanding. No Accounts or internal-system work is authorized.

## Verified source and design

Backend repository is clean at `9d322ddc953b0442b57366bc5c98211467f161e4`. Read the project root README, current AuthenticationController, PasswordRecoveryController, TokenResponse, ResetRequest, AccountExceptionHandler and SecurityConfiguration. Historical design source class names have changed: current password controller delegates to PasswordManagementService rather than PasswordRecoveryService. Recheck current services/DTOs before coding the adapter.

The task's original `docs/design/backoffice-login-accounts/` package is absent in this environment. Recovered the preserved attachment from task t_c95f7f07 into `backoffice/.design-reference/`, without changing project-root documentation. Archive SHA-256 verified against the packaging handoff:

`219e3d67b14cb0d6a4c543a206f623093704efad9b2faf8809d138da8f63d6b5`

Read IMPLEMENTATION-HANDOFF, COMPONENTS, CURRENT-STATES, FOUNDATION-CONTRACTS, FOUNDATION-QUESTIONS, OWNER-REVIEW, prototype.html and PROTOTYPE-INDEX.html. The implementation card records owner visual approval and supersedes the archived package's old approval-pending label. Approval does not resolve Q07 security/origin decisions.

## Source-confirmed HTTP boundary

- POST /api/auth/login {email,password} -> 200 TokenResponse.
- POST /api/auth/refresh {refreshToken} -> 200 TokenResponse.
- TokenResponse fields: accessToken, refreshToken, expiresIn (long), tokenType. Units/value constraints still require current mapper/service inspection before implementation.
- GET /api/auth/me with bearer -> 200 safe AccountResponse.
- POST /api/auth/logout with bearer, no payload -> 204.
- POST /api/auth/forgot-password {email} -> 202 {message:"If the account is eligible, a password link will be sent."}. Keep conditional UI copy; never claim verified delivery or identity existence.
- POST /api/auth/reset-password {token,password} -> 204. ResetRequest requires nonblank token <=200 Java string units, nonblank password 12–72 string units. README additionally documents <=72 UTF-8 bytes. Confirmation is client-only.
- Errors contain `code`, not field details: INVALID/400, UNAUTHENTICATED/401, FORBIDDEN/403, NOT_FOUND/404, CONFLICT/409, THROTTLED/429, DELIVERY or UNAVAILABLE/503. Request boundary additionally documents BODY_TOO_LARGE/413.
- Backend CORS is disabled; authentication is stateless explicit bearer/body credentials, not cookies. Do not introduce cookies/CSRF changes or guessed origins.
- README documents five-minute access tokens, absolute seven-day refresh lifetime, one active session per account, rotating refresh replay revocation, and single-use 30-minute fragment links shared between invitations/recovery. No link preflight/purpose/subreason endpoint.

## Proposed decisions requiring agreement (Q07/Q09)

Ask John (live profile `john-backend`) and owner/orchestrator to confirm:

1. Use frontend http://localhost:3000, relative /api requests and a loopback-only Vite development proxy to http://127.0.0.1:8080. Retain existing local RESET_URL http://localhost:3000/reset-password. No backend CORS or deployment changes.
2. Keep access/refresh credentials only in tab memory, never localStorage/sessionStorage/IndexedDB. Reload/closing the tab requires login. Serialize refresh with a single in-flight promise; clear credentials on failed/uncertain refresh without retrying the rotating credential. Tabs do not share credentials; a new login invalidates the previous session. This intentionally avoids a persisted shared token and cross-tab rotation race, but needs explicit UX/security agreement.
3. Use a neutral shared reset-password page for real email links, with optional /set-password presentation using the same endpoint, never inferred token purpose. Acquire fragment once, scrub it via replaceState, keep only in page memory, discard on navigation; reopening the original email link is necessary after reload.
4. Authenticated route is only a minimal current-user/login confirmation plus Logout for any authenticated role, not Accounts or a role-specific dashboard. Logout always clears local secrets/private UI; distinguish confirmed revocation from uncertain/local-only signout.

No implementation may label these proposals as agreed. Remaining account-only questions are outside this phase.

## Environment preflight and actual results

Commands executed from /mnt/e/projects/taxi/backoffice:

- node --version -> v26.7.0; npm --version -> 11.19.0.
- git status --short -> not a Git repository (expected empty frontend).
- git -C ../backend status --short -> clean; rev-parse HEAD -> revision above.
- hermes profile list -> verified john-backend, mica-frontend, kiara-designer, betty-qa and default exist.
- docker compose -f /mnt/e/projects/taxi/compose.yaml ps -> docker: command not found.
- curl --max-time 5 to http://127.0.0.1:8080/actuator/health -> HTTP 000, connection failed.
- curl --max-time 5 to http://127.0.0.1:8025 -> HTTP 000, connection failed.
- Alternative-path checks: docker.exe, java, mongod and mailpit are not on PATH; standard /mnt/c/Program Files/Docker/Docker/resources/bin/docker.exe is absent. No available local JVM/Mongo fallback established.

The root README requires Docker Engine/Desktop with WSL integration and explicitly selects compose.yaml. That stack has no SMTP server. Do not start the legacy stack alongside it or remove volumes. An operator must expose Docker/backend plus a reachable SMTP capture service (or provide equivalent authorized endpoints) before required live login/me/logout and email recovery/reset verification can pass.

No dependencies installed, React scaffold created, API mutations made, backend changes made, commits created, or builds/tests/screenshots claimed. Stop for prerequisite resolution, not owner code review: there is no implemented code to review yet.
