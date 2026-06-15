import jwt from "jsonwebtoken";

import {
  exchangeCodeForTokens,
  getGoogleUser,
} from "../services/googleOAuthService.js";

export const getGoogleAuthUrl =
  (req, res) => {

    const params =
      new URLSearchParams({
        client_id:
          process.env.GOOGLE_CLIENT_ID,

        redirect_uri:
          process.env.GOOGLE_REDIRECT_URI,

        response_type:
          "code",

        scope:
          "email profile",

        access_type:
          "offline",

        prompt:
          "consent",
      });

    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    res.json({ url });
  };

export const googleLogin =
  async (req, res) => {

    try {

      const { code } =
        req.body;

      const tokenData =
        await exchangeCodeForTokens(
          code
        );

      const user =
        await getGoogleUser(
          tokenData.access_token
        );

      const token =
        jwt.sign(
          {
            email:
              user.email,

            name:
              user.name,
          },

          process.env.JWT_SECRET,

          {
            expiresIn:
              "1d",
          }
        );

      res.json({
        token,
        user,
      });

    } catch (error) {

      console.error(error);

      res.status(500).json({
        message:
          "OAuth Failed",
      });
    }
  };

export const getProfile =
  (req, res) => {

    const authHeader =
      req.headers.authorization;

    if (!authHeader) {

      return res
        .status(401)
        .json({
          message:
            "Token Missing",
        });
    }

    const token =
      authHeader.split(" ")[1];

    const user =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );

    res.json(user);
  };