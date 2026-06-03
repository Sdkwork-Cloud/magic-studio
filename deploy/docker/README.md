# Magic Studio Server Docker Deployment

This directory defines the canonical server deployment contract for `magic-studio-v2`.

Deployment modes:

- `builtin-local`: private deployment with local user-center storage inside the Magic Studio server instance.
- `sdkwork-cloud-app-api`: shared login and user-center authority backed by `sdkwork-cloud-app-api`.
- `external-user-center`: third-party identity authority with the same login/user-center contract.

Operator workflow:

- Copy [`.env.example`](./.env.example) to `.env`.
- Set `MAGIC_STUDIO_USER_CENTER_MODE` to one of `builtin-local`, `sdkwork-cloud-app-api`, or `external-user-center`.
- For `builtin-local`, keep `MAGIC_STUDIO_USER_CENTER_SQLITE_PATH` or set `MAGIC_STUDIO_USER_CENTER_DATABASE_URL`.
- For `sdkwork-cloud-app-api`, set `MAGIC_STUDIO_USER_CENTER_APP_API_BASE_URL`, `MAGIC_STUDIO_USER_CENTER_SECRET_ID`, and `MAGIC_STUDIO_USER_CENTER_SHARED_SECRET`.
- For `external-user-center`, set `MAGIC_STUDIO_USER_CENTER_EXTERNAL_BASE_URL`, `MAGIC_STUDIO_USER_CENTER_SECRET_ID`, and `MAGIC_STUDIO_USER_CENTER_SHARED_SECRET`.

Authentication and session propagation stay configurable through:

- `MAGIC_STUDIO_USER_CENTER_AUTHORIZATION_HEADER_NAME`
- `MAGIC_STUDIO_USER_CENTER_ACCESS_TOKEN_HEADER_NAME`
- `MAGIC_STUDIO_USER_CENTER_REFRESH_TOKEN_HEADER_NAME`
- `MAGIC_STUDIO_USER_CENTER_SESSION_HEADER_NAME`
- `MAGIC_STUDIO_USER_CENTER_AUTHORIZATION_SCHEME`
- `MAGIC_STUDIO_USER_CENTER_ALLOW_AUTHORIZATION_FALLBACK_TO_ACCESS_TOKEN`
- `MAGIC_STUDIO_USER_CENTER_HANDSHAKE_FRESHNESS_WINDOW_MS`

The resulting server deployment contract is intentionally aligned with the shared user-center and validation plugin standard used by the Magic Studio UI packages.
