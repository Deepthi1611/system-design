import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Login
  from "./pages/Login";

import AuthCallback
  from "./pages/AuthCallback";

import Profile
  from "./pages/Profile";

function App() {

  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={
            <Login />
          }
        />

        <Route
          path="/auth/callback"
          element={
            <AuthCallback />
          }
        />

        <Route
          path="/profile"
          element={
            <Profile />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;