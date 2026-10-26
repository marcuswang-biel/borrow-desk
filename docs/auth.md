# Auth

Better Auth runs inside the API at `/api/auth`, with email and password. The JWT plugin issues the bearer token the HttpApi middleware checks. The browser keeps the session cookie and sends `Authorization: Bearer` from `GET /api/auth/token`.

Development and production each have their own database and their own `AUTH_PUBLIC_URL`. The development secret is a fixed local string. Production requires `BETTER_AUTH_SECRET`.

`ADMIN_EMAIL` lists the admin addresses, separated by commas. Comparison ignores case. The role is not stored by Better Auth; the API assigns it when it verifies the token. Sign-up cannot choose a role.

The page and the API share an origin. In development, Vite proxies `/api` to port 3000 so the cookie is set for `http://localhost:5173`.
