import { useContext, useState } from "react";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContextDefinition";

const LoginPage = () => {
  const [currState, setCurrentState] = useState("Sign up");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bio, setBio] = useState("");
  const [isDataSubmitted, setIsDataSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useContext(AuthContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (currState === "Sign up" && !isDataSubmitted) {
      setIsDataSubmitted(true);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(currState === "Sign up" ? "signup" : "login", {
        fullName,
        email,
        password,
        bio: bio || "Hey there! I am using Quick Chat.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center gap-8 sm:justify-evenly max-sm:flex-col backdrop-blur-2xl p-4">
      {/* -------- left -------- */}
      <img src={assets.logo_big} alt="logo" className="w-[min(30vw,250px)] drop-shadow-xl" />

      {/* -------- right -------- */}
      <form
        onSubmit={onSubmitHandler}
        className="w-full max-w-md border-2 bg-black/40 backdrop-blur-xl text-white border-gray-600 p-8 flex flex-col gap-5 rounded-2xl shadow-2xl"
      >
        <h2 className="font-semibold text-2xl flex justify-between items-center text-white">
          {currState}
          {isDataSubmitted && (
            <img
              onClick={() => setIsDataSubmitted(false)}
              src={assets.arrow_icon}
              alt="arrow"
              className="w-5 cursor-pointer hover:opacity-80 transition-opacity"
            />
          )}
        </h2>

        {currState === "Sign up" && !isDataSubmitted && (
          <input
            onChange={(e) => setFullName(e.target.value)}
            value={fullName}
            type="text"
            className="p-3 bg-white/5 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm text-white placeholder-gray-400"
            placeholder="Full Name"
            required
          />
        )}

        {!isDataSubmitted && (
          <>
            <input
              onChange={(e) => setEmail(e.target.value)}
              value={email}
              type="email"
              placeholder="Email Address"
              required
              className="p-3 bg-white/5 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm text-white placeholder-gray-400"
            />
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type="password"
              placeholder="Password (min 6 characters)"
              required
              minLength={6}
              className="p-3 bg-white/5 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm text-white placeholder-gray-400"
            />
          </>
        )}

        {currState === "Sign up" && isDataSubmitted && (
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            rows={4}
            className="p-3 bg-white/5 border border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm text-white placeholder-gray-400 resize-none"
            placeholder="Provide a short bio..."
            required
          ></textarea>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="py-3 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-lg text-sm font-medium transition-all shadow-lg cursor-pointer disabled:opacity-50"
        >
          {isSubmitting
            ? "Please wait..."
            : currState === "Sign up"
            ? isDataSubmitted
              ? "Complete Sign Up"
              : "Continue"
            : "Login Now"}
        </button>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <input type="checkbox" defaultChecked className="accent-violet-500 cursor-pointer" />
          <p>Agree to terms of use & privacy policy.</p>
        </div>

        <div className="flex flex-col gap-2 pt-2 border-t border-gray-700">
          {currState === "Sign up" ? (
            <p className="text-xs text-gray-400 text-center">
              Already have an account?{" "}
              <span
                onClick={() => {
                  setCurrentState("Login");
                  setIsDataSubmitted(false);
                }}
                className="font-semibold text-violet-400 hover:underline cursor-pointer"
              >
                Login here
              </span>
            </p>
          ) : (
            <p className="text-xs text-gray-400 text-center">
              Don't have an account?{" "}
              <span
                onClick={() => {
                  setCurrentState("Sign up");
                  setIsDataSubmitted(false);
                }}
                className="font-semibold text-violet-400 hover:underline cursor-pointer"
              >
                Create an account
              </span>
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default LoginPage;
