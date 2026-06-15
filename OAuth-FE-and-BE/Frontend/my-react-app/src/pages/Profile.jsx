import {
  useEffect,
  useState,
} from "react";

import {
  getProfile,
} from "../services/authServices";

function Profile() {

  const [
    user,
    setUser,
  ] = useState(null);

  useEffect(() => {

    const loadProfile =
      async () => {

        const token =
          localStorage.getItem(
            "token"
          );

        const user =
          await getProfile(
            token
          );

        setUser(user);
      };

    loadProfile();

  }, []);

  if (!user) {
    return (
      <h1>
        Loading...
      </h1>
    );
  }

  return (
    <div>

      <h1>
        Welcome
      </h1>

      <p>
        {user.name}
      </p>

      <p>
        {user.email}
      </p>

    </div>
  );
}

export default Profile;