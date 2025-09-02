import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import { sessionManager } from "../lib/sessionManager.js";

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:9000" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      // Check if this tab already has a user session
      const existingUserSession = sessionManager.getUserSession();
      if (existingUserSession && existingUserSession.userId) {
        console.log("Found existing user session for this tab:", existingUserSession.userId);
        // Don't call the server, use the existing session
        set({ authUser: { _id: existingUserSession.userId } });
        get().connectSocket();
        set({ isCheckingAuth: false });
        return;
      }

      const res = await axiosInstance.get("/auth/check");

      if (res.data && res.data._id) {
        set({ authUser: res.data });
        // Store the user session for this tab
        sessionManager.setUserSession(res.data._id);
        get().connectSocket();
      } else {
        set({ authUser: null });
      }
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      const res = await axiosInstance.post("/auth/signup", data);
      set({ authUser: res.data });
      // Store the user session for this tab
      sessionManager.setUserSession(res.data._id);
      toast.success("Account created successfully");
      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (data) => {
    set({ isLoggingIn: true });
    try {
      const res = await axiosInstance.post("/auth/login", data);
      set({ authUser: res.data });
      // Store the user session for this tab
      sessionManager.setUserSession(res.data._id);
      toast.success("Logged in successfully");

      get().connectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isLoggingIn: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      set({ authUser: null });
      // Clear the user session for this tab
      sessionManager.cleanup();
      toast.success("Logged out successfully");
      get().disconnectSocket();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      const res = await axiosInstance.put("/auth/update-profile", data);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
    } catch (error) {
      console.log("error in update profile:", error);
      toast.error(error.response.data.message);
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return;

    // Disconnect existing socket if connected
    if (socket?.connected) {
      socket.disconnect();
    }

    const newSocket = io(BASE_URL, {
      query: {
        userId: authUser._id,
        sessionId: sessionManager.getSessionId(),
      },
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    set({ socket: newSocket });

    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("Online users updated:", userIds);
      set({ onlineUsers: userIds });
    });

    newSocket.on("newMessage", (message) => {
      console.log("Received newMessage event in auth store:", message);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Connection error. Retrying...");
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
      if (reason === "io server disconnect") {
        // Server disconnected, try to reconnect
        newSocket.connect();
      } else if (reason === "client namespace disconnect") {
        // This might be due to session conflict
        console.log("Disconnected due to session conflict");
        toast.error("Another session detected. Please refresh the page.");
      }
    });

    newSocket.on("reconnect", (attemptNumber) => {
      console.log("Socket reconnected after", attemptNumber, "attempts");
      toast.success("Reconnected to server");
    });

    newSocket.on("reconnect_error", (error) => {
      console.error("Reconnection error:", error);
    });

    newSocket.on("reconnect_failed", () => {
      console.error("Failed to reconnect to server");
      toast.error("Failed to reconnect. Please refresh the page.");
    });

    // Handle session conflict
    newSocket.on("session_conflict", () => {
      console.log("Session conflict detected");
      toast.error("Another session is active. This tab will be disconnected.");
      newSocket.disconnect();
    });
  },
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      set({ socket: null, onlineUsers: [] });
    }
  },
}));