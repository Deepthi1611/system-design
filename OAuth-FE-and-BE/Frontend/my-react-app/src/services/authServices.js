import axios from "axios";

const API =
  "http://localhost:3000/api/auth";

export const getGoogleUrl =
  async () => {

    const response =
      await axios.get(
        `${API}/google-url`
      );

    return response.data;
  };

export const loginWithGoogleCode =
  async (code) => {

    const response =
      await axios.post(
        `${API}/google`,
        { code }
      );

    return response.data;
  };

export const getProfile =
  async (token) => {

    const response =
      await axios.get(
        `${API}/profile`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

    return response.data;
  };