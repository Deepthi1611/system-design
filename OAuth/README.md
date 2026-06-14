# OAuth Demo Server

This folder contains a simple Google OAuth 2.0 demo implemented in `server.js` using Express, `axios`, `dotenv`, and `express-session`.

## What `server.js` does

1. Loads environment variables from `.env` using `dotenv`.
2. Creates an Express application.
3. Configures middleware:
   - `express.json()` to parse JSON request bodies (not strictly required for OAuth redirects but useful for future JSON endpoints).
   - `express-session` to store authenticated user data in server-side session storage.
4. Defines routes for the OAuth login flow and session management.
5. Starts the server on `http://localhost:3000`.

## Route summary

- `/` - Home route that renders a simple HTML page with a link to sign in with Google.
- `/auth/google` - Redirects the browser to Google's OAuth 2.0 authorization endpoint.
- `/auth/google/callback` - Receives the authorization code from Google, exchanges it for tokens, fetches the user profile, stores the user in session, and returns the result.
- `/profile` - Returns the current logged-in user from the session.
- `/logout` - Destroys the session and logs the user out.

## Step-by-step flow

### 1. User visits home page

The user opens `http://localhost:3000/` and sees a page with a `Login with Google` link.

### 2. User clicks login link

The browser navigates to `/auth/google`.

### 3. Server builds the Google authorization URL

`server.js` constructs a URL that includes:

- `client_id` - the Google OAuth client ID from environment variables.
- `redirect_uri` - where Google should send the user after consent.
- `response_type=code` - this is the authorization code flow.
- `scope=email profile` - requests access to the user's email and profile.
- `access_type=offline` - asks Google for a refresh token so the app can request new access tokens later.
- `prompt=consent` - forces the consent screen on each login, ensuring refresh token issuance.

Then it sends a redirect to Google.

### 4. Google prompts the user

Google shows a login/consent page. The user logs in and consents to share their profile and email.

### 5. Google redirects back with an authorization code

After approval, Google redirects the browser to the configured callback URL: `/auth/google/callback`.

The callback request includes a query parameter:

- `code` - the authorization code.

### Why the authorization code is needed

The authorization code is a short-lived credential that proves the user has authenticated and consented. It is sent to the server instead of a token directly to keep sensitive client credentials and tokens out of the browser.

This is the key benefit of the OAuth authorization code flow:

- The browser only sees the authorization code.
- The server exchanges the code securely with Google using the `client_secret`.
- The server receives tokens and can keep them safe.

This prevents exposing access tokens directly in the browser and allows the server to validate the flow.

### 6. Server exchanges the authorization code for tokens

In `/auth/google/callback`, the server does the following:

1. Reads `code` from `req.query`.
2. Makes a POST request to `https://oauth2.googleapis.com/token` with:
   - `code`
   - `client_id`
   - `client_secret`
   - `redirect_uri`
   - `grant_type=authorization_code`
3. Receives a token response containing:
   - `access_token`
   - `refresh_token`
   - `id_token`

### 7. Server fetches the user profile

Using the `access_token`, the server sends a GET request to Google's userinfo endpoint:

- `https://www.googleapis.com/oauth2/v2/userinfo`

The `Authorization` header includes:

- `Bearer <access_token>`

Google returns the authenticated user's profile data.

### 8. Server stores the user in session

The server saves the user object in `req.session.user`, which keeps the login state between requests.

The cookie that links the browser to this session is not set manually in your code. `express-session` handles that automatically.

When the middleware creates or updates a session, it sends a `Set-Cookie` header to the browser. The cookie typically uses the default name `connect.sid`, and it contains only the session ID, not the user data itself.

This means:

- the browser stores the session ID cookie
- every subsequent request sends that cookie back to the server
- the server uses the session ID to look up `req.session` data, including `req.session.user`

If you want, the cookie behavior can be customized with the `cookie` option inside the `express-session` configuration.

### 9. Client can access `/profile`

The `/profile` route checks if `req.session.user` exists.

- If yes, it returns the stored user object.
- If no, it returns `401 Not Authenticated`.

### 10. Logout

The `/logout` route destroys the session and returns a success message.

## Why this flow matters

This demo implements the OAuth 2.0 Authorization Code Grant, which is the recommended flow for server-side web apps because:

- It keeps client secrets confidential on the server.
- It avoids exposing access tokens in the browser.
- It allows refresh tokens for long-lived sessions.
- It supports session-based login on the server.

## Environment variables

The app uses the following variables from `.env`:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `SESSION_SECRET`

Make sure those are set before running the server.

## Running the server

```bash
cd OAuth
npm install
node server.js
```

Then open `http://localhost:3000` in your browser.
