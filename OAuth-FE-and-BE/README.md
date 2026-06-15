# Google OAuth — End-to-end flow (Frontend + Backend)

This document explains the complete Google OAuth flow used by this project, covering both the frontend (Vite React app) and the backend (Express) components, required environment variables, endpoints, and common troubleshooting notes.

## High-level flow

1. User clicks **Login with Google** in the frontend.
2. Frontend calls backend `GET /api/auth/google-url` to request the Google consent URL.
3. Backend builds the Google OAuth URL using `GOOGLE_CLIENT_ID` and `GOOGLE_REDIRECT_URI` (the redirect URI points back to the frontend callback route) and returns it.
4. Frontend redirects the browser to Google consent screen (the returned URL).
5. User authenticates at Google and Google redirects back to the frontend `redirect_uri` with a `code` query parameter.
6. Frontend `AuthCallback` page extracts the `code` and POSTs it to backend `POST /api/auth/google` as `{ code }`.
7. Backend exchanges the `code` for tokens at `https://oauth2.googleapis.com/token` using `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and the same `GOOGLE_REDIRECT_URI`.
8. Backend uses the `access_token` to fetch the Google user profile and then issues its own JWT (signed with `JWT_SECRET`) and returns `{ token, user }` to frontend.
9. Frontend stores the JWT (e.g., `localStorage.setItem('token', token)`) and navigates to protected UI (e.g., `/profile`).
10. Frontend requests protected data from backend (`GET /api/auth/profile`) with `Authorization: Bearer <token>`. Backend verifies the JWT and returns user info.

## Code locations (this repo)

- Backend controller that builds auth URL: `Backend/controllers/authController.js` (function `getGoogleAuthUrl`)
- Backend endpoint that exchanges code: `Backend/controllers/authController.js` (function `googleLogin`)
- Backend Google helper: `Backend/services/googleOAuthService.js` (performs token exchange and userinfo fetch)
- Frontend call to request URL: `Frontend/my-react-app/src/services/authServices.js` (`getGoogleUrl`)
- Frontend callback handler that posts code: `Frontend/my-react-app/src/pages/AuthCallback.jsx`
- Frontend login UI that triggers login: `Frontend/my-react-app/src/pages/Login.jsx`

## Important environment variables

Backend `.env` (examples from this repo):

- `GOOGLE_CLIENT_ID` = your-client-id.apps.googleusercontent.com
- `GOOGLE_CLIENT_SECRET` = your client secret
- `GOOGLE_REDIRECT_URI` = the redirect URI registered in Google Console (e.g. `http://localhost:5173/auth/callback`)
- `JWT_SECRET` = your JWT signing secret

Make sure `GOOGLE_REDIRECT_URI` used in the backend matches the redirect URI you register in the Google Console.

## Exact endpoints used by the frontend

- `GET http://localhost:3000/api/auth/google-url` — returns `{ url }` to redirect user to Google consent.
- `POST http://localhost:3000/api/auth/google` — accepts `{ code }` and returns `{ token, user }` after exchanging the code.
- `GET http://localhost:3000/api/auth/profile` — protected backend endpoint that returns user info when given `Authorization: Bearer <token>`.

Note: these base URLs are taken from `Frontend/my-react-app/src/services/authServices.js` where `API = "http://localhost:3000/api/auth"`.

## Redirect URI to register in Google Console

Register the frontend callback URI(s) from your local dev environment. Based on this project configuration the recommended redirect URIs are:

- `http://localhost:5173/auth/callback`  (default Vite port)
- `http://localhost:5174/auth/callback`  (Vite may fall back to another port; include both while developing)

Why frontend callback? The backend in this project expects the frontend to receive the Google `code` and then send that `code` to backend to perform the token exchange. The backend uses the same `GOOGLE_REDIRECT_URI` when calling Google's token endpoint.

If you instead want Google to redirect directly to the backend (server-side flow), you'd set `GOOGLE_REDIRECT_URI` to a backend route (example: `http://localhost:3000/api/auth/google/callback`) and change the frontend flow accordingly.

## Running the apps (dev)

Backend (default port 3000):
```bash
cd OAuth-FE-and-BE/Backend
npm install
npm run dev
```

Frontend (Vite):
```bash
cd OAuth-FE-and-BE/Frontend/my-react-app
npm install
npm run dev
```

If Vite chooses a different port (e.g. 5174), include that port in your Google Console redirect URIs or force Vite to a specific port: `npm run dev -- --port 5173`.

## Example sequence (request/response)

1. Frontend GET `/api/auth/google-url` → Backend responds `{ "url": "https://accounts.google.com/o/oauth2/v2/auth?...&redirect_uri=http://localhost:5173/auth/callback" }`
2. Browser goes to Google; user consents; Google redirects to `http://localhost:5173/auth/callback?code=AUTH_CODE`.
3. Frontend extracts code and POSTs to `/api/auth/google` with body `{ code: "AUTH_CODE" }`.
4. Backend POSTs to `https://oauth2.googleapis.com/token` with form data including `code`, `client_id`, `client_secret`, `redirect_uri`.
5. Google returns `{ access_token, refresh_token, expires_in, id_token }` and backend uses `access_token` to GET userinfo.
6. Backend creates its own JWT and responds `{ token: "<jwt>", user: { name, email, ... } }`.

## Troubleshooting

- Blank page on frontend: open browser console and Vite terminal. Ensure `react-router-dom` and other dependencies are installed and that `src/main.jsx` imports `index.css` correctly.
- `npx tailwindcss init -p` error: install `tailwindcss` as a dev dependency first (`npm install -D tailwindcss postcss autoprefixer`) or use `npx --package tailwindcss tailwindcss init -p`.
- Mismatched redirect URI: Google will reject the code exchange if the `redirect_uri` parameter used in the token exchange does not exactly match the one registered in the Google Console. Keep the same `GOOGLE_REDIRECT_URI` value across the backend `.env`, the Google Console entry, and the frontend callback route.
- Ports: include any fallback ports Vite chooses when registering redirect URIs in Google Console.
- Ensure backend `.env` contains `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` and that the backend is able to reach Google's token endpoint.

## Security notes

- Never commit `GOOGLE_CLIENT_SECRET` or `JWT_SECRET` to source control. Use environment variables or a secrets manager.
- In production, use HTTPS and actual domain redirect URIs (e.g., `https://yourdomain.com/auth/callback`).

---

If you'd like, I can also add a short architecture diagram or wire this README into the frontend `README.md` with a link. 
