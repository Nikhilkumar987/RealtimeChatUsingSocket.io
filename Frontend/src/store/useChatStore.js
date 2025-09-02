import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios.js";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,
  unreadMessages: {}, // {userId: count}

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },
  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    if (!selectedUser) {
      toast.error("No user selected");
      return;
    }
    
    try {
      console.log("Sending message to:", selectedUser._id);
      console.log("Message data:", {
        text: messageData.text,
        hasImage: !!messageData.image,
        imageLength: messageData.image ? messageData.image.length : 0
      });
      
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      console.log("Message sent successfully:", res.data);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      console.error("Error sending message:", error);
      console.error("Error response:", error.response?.data);
      toast.error(error.response?.data?.message || error.response?.data?.error || "Failed to send message");
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) {
      console.warn("Socket not available for message subscription");
      return;
    }

    console.log("Subscribing to all incoming messages");

    socket.on("newMessage", (newMessage) => {
      console.log("Received new message:", newMessage);
      
      const { selectedUser, messages } = get();
      const { authUser } = useAuthStore.getState();
      
      // Check if this message is for the current user
      if (newMessage.receiverId !== authUser._id) {
        console.log("Message not for current user, ignoring");
        return;
      }
      
      // If we have a selected user and this message is from them, add it to the current chat
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        console.log("Adding message to current chat");
        set({
          messages: [...messages, newMessage],
        });
      } else {
        console.log("Message from different user, will show notification");
        // Add to unread count
        const { unreadMessages } = get();
        const senderId = newMessage.senderId;
        set({
          unreadMessages: {
            ...unreadMessages,
            [senderId]: (unreadMessages[senderId] || 0) + 1
          }
        });
        
        // Show notification
        toast.success(`New message from ${senderId}`);
      }
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      toast.error("Connection error. Please refresh the page.");
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newMessage");
      socket.off("connect_error");
    }
  },

  setSelectedUser: (selectedUser) => {
    set({ selectedUser });
    // Clear unread count when selecting a user
    if (selectedUser) {
      const { unreadMessages } = get();
      set({
        unreadMessages: {
          ...unreadMessages,
          [selectedUser._id]: 0
        }
      });
    }
  },

  getUnreadCount: (userId) => {
    const { unreadMessages } = get();
    return unreadMessages[userId] || 0;
  },
}));