import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useChatStore } from "./store/useChatStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import ConnectionStatus from "./components/ConnectionStatus.jsx";
import MultiTabWarning from "./components/MultiTabWarning.jsx";
import SessionDebug from "./components/SessionDebug.jsx";
import MessageDebug from "./components/MessageDebug.jsx";
import ImageTest from "./components/ImageTest.jsx";
import { sessionManager } from "./lib/sessionManager.js";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers, disconnectSocket } = useAuthStore();
  const { theme } = useThemeStore();
  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore();

  console.log({ onlineUsers });

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Cleanup socket connection on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
      sessionManager.cleanup();
    };
  }, [disconnectSocket]);

  // Handle session management
  useEffect(() => {
    const cleanup = sessionManager.onStorageChange(() => {
      // Primary session was closed, this tab can become primary
      if (authUser) {
        toast.success("You can now use this tab as the primary session.");
        // Reconnect socket if needed
        const { connectSocket } = useAuthStore.getState();
        connectSocket();
      }
    });

    return cleanup;
  }, [authUser]);

  // Set up global message subscription when user is authenticated
  useEffect(() => {
    if (authUser) {
      console.log("Setting up global message subscription for user:", authUser._id);
      subscribeToMessages();
    }

    return () => {
      if (authUser) {
        unsubscribeFromMessages();
      }
    };
  }, [authUser, subscribeToMessages, unsubscribeFromMessages]);

  console.log({ authUser });

  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    <ErrorBoundary>
      <div data-theme={theme}>
        <Navbar />

        <Routes>
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
          <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
          <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
        </Routes>

        <Toaster />
        <ConnectionStatus />
        <MultiTabWarning />
        <SessionDebug />
        <MessageDebug />
        <ImageTest />
      </div>
    </ErrorBoundary>
  );
};
export default App;