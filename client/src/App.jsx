import { Navigate, Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import { Toaster } from "react-hot-toast";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContextDefinition";
import bgImage from "./assets/bgImage.svg";

const App = () => {
  const { authUser, isCheckingAuth } = useContext(AuthContext);

  if (isCheckingAuth) {
    return (
      <div
        className="min-h-screen bg-cover bg-center flex flex-col items-center justify-center gap-4"
        style={{ backgroundImage: `url(${bgImage})` }}
      >
        <div className="w-12 h-12 border-4 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-white text-sm font-medium tracking-wide">Loading Quick Chat...</p>
      </div>
    );
  }

  return (
    <div
      className="bg-contain min-h-screen"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <Toaster position="top-right" />
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/login"
          element={!authUser ? <LoginPage /> : <Navigate to="/" replace />}
        />
        <Route
          path="/profile"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={authUser ? "/" : "/login"} replace />}
        />
      </Routes>
    </div>
  );
};

export default App;
