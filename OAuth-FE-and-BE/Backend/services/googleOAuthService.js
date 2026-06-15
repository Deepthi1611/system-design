import axios from "axios";

export const exchangeCodeForTokens =
  async (code) => {

    const response =
      await axios.post(
        "https://oauth2.googleapis.com/token",

        new URLSearchParams({
          code,

          client_id:
            process.env.GOOGLE_CLIENT_ID,

          client_secret:
            process.env.GOOGLE_CLIENT_SECRET,

          redirect_uri:
            process.env.GOOGLE_REDIRECT_URI,

          grant_type:
            "authorization_code",
        }),

        {
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
        }
      );

    return response.data;
  };

export const getGoogleUser =
  async (accessToken) => {

    const response =
      await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },
        }
      );

    return response.data;
  };