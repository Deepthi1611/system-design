import express from "express";
import axios from "axios";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || "jwt-secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

app.use(express.json());

/**
 * Home Route
 */
app.get("/", (req, res) => {
  res.send(`
    <h1>Google OAuth Demo (JWT)</h1>

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

    const { access_token, refresh_token, id_token } = tokenResponse.data;

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
     * Create JWT Token
     */
    const jwtToken = jwt.sign({ user }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    res.json({
      message: "Login Successful",
      user,
      token: jwtToken,
    });
  } catch (error) {
    console.error(error.response?.data || error.message);

    res.status(500).json({
      error: "OAuth Failed",
      details: error.response?.data || error.message,
    });
  }
});

/**
 * Middleware to verify JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/**
 * Current Logged In User
 */
app.get("/profile", authenticateToken, (req, res) => {
  res.json(req.user);
});

/**
 * Logout
 */
app.get("/logout", (req, res) => {
  res.json({
    message: "Logged Out Successfully (discard the JWT token on the client)",
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
