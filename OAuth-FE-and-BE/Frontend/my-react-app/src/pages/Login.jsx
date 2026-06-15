import {
  getGoogleUrl,
} from "../services/authServices";

function Login() {

  const handleLogin =
    async () => {

      const response =
        await getGoogleUrl();

      window.location.href =
        response.url;
    };

  return (
    <div>
      <h1>
        Login Page
      </h1>

      <button
        onClick={
          handleLogin
        }
      >
        Login With Google
      </button>
    </div>
  );
}

export default Login;