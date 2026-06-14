import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import session from "express-session";

dotenv.config();

const app = express();

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);

/**
 * Home Route
 */
app.get("/", (req, res) => {
  res.send(`
    <h1>Google OAuth Demo</h1>

    <a href="/auth/google">
      Login with Google
    </a>
  `);
});

/**
 * Step 1:
 * Redirect User To Google
 */
app.get("/auth/google", (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    response_type: "code",
    scope: "email profile",
    access_type: "offline",
    prompt: "consent",
  });

  const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  res.redirect(googleAuthUrl);
});

/**
 * Step 2:
 * Google Redirects Back Here
 */
app.get("/auth/google/callback", async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({
        error: "Authorization code missing",
      });
    }

    /**
     * Exchange Authorization Code
     * For Tokens
     */
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: "authorization_code",
      }
    );

    const {
      access_token,
      refresh_token,
      id_token,
    } = tokenResponse.data;

    console.log("Access Token:", access_token);
    console.log("Refresh Token:", refresh_token);
    console.log("ID Token:", id_token);

    /**
     * Fetch User Profile
     */
    const userResponse = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    const user = userResponse.data;

    /**
     * Save User In Session
     */
    req.session.user = user;

    res.json({
      message: "Login Successful",
      user,
    });
  } catch (error) {
    console.error(
      error.response?.data || error.message
    );

    res.status(500).json({
      error: "OAuth Failed",
      details:
        error.response?.data || error.message,
    });
  }
});

/**
 * Current Logged In User
 */
app.get("/profile", (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({
      message: "Not Authenticated",
    });
  }

  res.json(req.session.user);
});

/**
 * Logout
 */
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({
      message: "Logged Out Successfully",
    });
  });
});

app.listen(3000, () => {
  console.log(
    "Server running on http://localhost:3000"
  );
});