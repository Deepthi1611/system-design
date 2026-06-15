import {
  useEffect,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  loginWithGoogleCode,
} from "../services/authServices";

function AuthCallback() {

  const navigate =
    useNavigate();

  const [params] =
    useSearchParams();

  useEffect(() => {

    const authenticate =
      async () => {

        const code =
          params.get(
            "code"
          );

        const response =
          await loginWithGoogleCode(
            code
          );

        localStorage.setItem(
          "token",
          response.token
        );

        navigate(
          "/profile"
        );
      };

    authenticate();

  }, []);

  return (
    <h1>
      Logging In...
    </h1>
  );
}

export default AuthCallback;