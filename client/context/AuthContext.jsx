import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { AuthContext } from "./AuthContextDefinition";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [authUser, setAuthUser] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(Boolean(localStorage.getItem("token")));

  // Clear auth state helper
  const clearAuth = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setAuthUser(null);
    setOnlineUsers([]);
    delete axios.defaults.headers.common["token"];
  }, []);

  // Check if user is authenticated and if so, set the user data and connect the socket
  const connectSocket = useCallback((userData) => {
    if (!userData || (socket && socket.connected)) return;

    try {
      const newSocket = io(backendUrl, {
        query: { userId: userData._id },
      });

      newSocket.connect();
      setSocket(newSocket);
      newSocket.on("getOnlineUsers", setOnlineUsers);
    } catch (err) {
      console.warn("Socket connection failed:", err.message);
    }
  }, [socket]);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/auth/check");

      if (data.success && data.user) {
        setAuthUser(data.user);
        connectSocket(data.user);
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    } finally {
      setIsCheckingAuth(false);
    }
  }, [clearAuth, connectSocket]);

  // Login function to handle user authentication and socket connection
  const login = async (state, credentials) => {
    try {
      const { data } = await axios.post(`/api/auth/${state}`, credentials);

      if (data.success) {
        setAuthUser(data.userData);
        connectSocket(data.userData);
        axios.defaults.headers.common["token"] = data.token;
        setToken(data.token);
        localStorage.setItem("token", data.token);
        toast.success(data.message || "Logged in successfully");
        return { success: true };
      } else {
        toast.error(data.message || "Authentication failed");
        return { success: false, message: data.message };
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "An error occurred";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Logout function to handle user logout and socket disconnection
  const logout = async () => {
    clearAuth();
    toast.success("Logged out successfully");
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
  };

  // Update profile function to handle user profile updates
  const updateProfile = async (body) => {
    try {
      const { data } = await axios.put("/api/auth/update-profile", body);
      if (data.success && data.user) {
        setAuthUser(data.user);
        toast.success("Profile updated successfully");
      } else {
        toast.error(data.message || "Failed to update profile");
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Failed to update profile";
      toast.error(msg);
    }
  };

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["token"] = token;
      checkAuth();
    } else {
      setIsCheckingAuth(false);
    }
  }, [checkAuth, token]);

  const value = {
    axios,
    authUser,
    onlineUsers,
    socket,
    isCheckingAuth,
    login,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
