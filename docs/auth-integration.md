# Authentication integration contract

Status: HTTP contract verified from live OpenAPI and source; Q07/Q09 client policy PROPOSED, awaiting explicit agreement on t_3cd4c379. Do not mistake the approved visual design for security-policy approval.

Sources: live http://localhost:8080/v3/api-docs (snapshot openapi-local.json), root README and backend 9d322ddc953b0442b57366bc5c98211467f161e4. Read AuthenticationController, PasswordRecoveryController, AuthenticationService, PasswordManagementService, AccountPolicyService, SecurityConfiguration and OpaqueTokens.

HTTP boundary (all JSON except 204):
- POST /api/auth/login {email,password} -> 200 {accessToken,refreshToken,expiresIn,tokenType}. expiresIn is seconds, currently 300; tokenType is Bearer. Login accepts short existing passwords; nonblank, <=72 UTF-8 bytes. No password trimming.
- GET /api/auth/me, Authorization: Bearer -> 200 safe identity. Only id/email/roles needed by this phase. Never infer roles from JWT.
- POST /api/auth/refresh {refreshToken} -> 200 rotated pair. Max credential length 200. Absolute seven-day lifetime, not sliding; active-family replay can revoke winner.
- POST /api/auth/logout, bearer, no body -> 204. Clear private UI even on uncertain response; do not claim server revocation without confirmation.
- POST /api/auth/forgot-password {email} -> 202 {message}. Identical conditional confirmation for unknown/disabled/internally throttled/delivery-failed accounts; never a delivery receipt.
- POST /api/auth/reset-password {token,password} -> 204. Confirmation client-only. Nonblank token <=200 UTF-16 units. Password >=12 UTF-16 units, <=72 UTF-8 bytes. No composition rule, no trimming.
- Email <=254 units, trimmed/lowercased by backend; required valid address.
- Error {code}: 400 INVALID, 401 UNAUTHENTICATED, 403 FORBIDDEN, 409 CONFLICT, 413 BODY_TOO_LARGE, 429 THROTTLED, 503 DELIVERY/UNAVAILABLE. Do not display raw backend text. HTTP 409 is present in handler/service behavior even where controller annotations omit it.
- A 401 link cannot diagnose expiry, use, replacement, disabled or nonexistent identity. No token preflight or invitation-specific endpoint exists.

Client decisions proposed, not agreed:
1. localhost:3000, same-origin /api through loopback Vite proxy to 127.0.0.1:8080. Backend CORS stays disabled; no cookies. Deployment/reverse proxy is outside scope.
2. Tab-memory-only tokens, no browser persistence or cross-tab sharing. Reload/close requires login. New login revokes earlier sessions. Single-flight rotation; discard on any failed/uncertain refresh, no replay of rotating credential or uncertain writes.
3. Existing RESET_URL http://localhost:3000/reset-password#token=...; capture once then replace history URL, page-memory only, discard on leave/success. /set-password is contextual copy only. No analytics or credential logs.
4. Authenticated confirmation for all roles plus Logout only; no internal system/Accounts.

Implementation boundary while agreement is pending: AuthPort isolates UI from transport; production default fails closed with truthful integration-pending feedback, never mocked success. Unit/component tests inject synthetic AuthPort only. No credential persistence or guessed token handling enabled.

Runtime blocker update: backend health and Swagger now reachable; operator reports Mailpit reachable. Previous missing-Docker block is superseded. Real authentication/email verification is still outstanding, not inferred from health checks.
