import express from "express";

import {
  getGoogleAuthUrl,
  googleLogin,
  getProfile,
} from "../controllers/authController.js";

const router =
  express.Router();

router.get(
  "/google-url",
  getGoogleAuthUrl
);

router.post(
  "/google",
  googleLogin
);

router.get(
  "/profile",
  getProfile
);

export default router;