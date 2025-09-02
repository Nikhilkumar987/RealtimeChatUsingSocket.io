import User from "../models/user.model.js";
import Message from "../models/message.model.js";

import cloudinary from "../lib/cloudinary.js";
import { getAllReceiverSocketIds, io } from "../lib/socket.js";

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");

    res.status(200).json(filteredUsers);
  } catch (error) {
    console.error("Error in getUsersForSidebar: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    });

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    console.log(`Sending message from ${senderId} to ${receiverId}:`, { text, hasImage: !!image });

    let imageUrl;
    if (image) {
      try {
        console.log("Uploading image to Cloudinary...");
        // Upload base64 image to cloudinary
        const uploadResponse = await cloudinary.uploader.upload(image);
        imageUrl = uploadResponse.secure_url;
        console.log("Image uploaded successfully:", imageUrl);
      } catch (uploadError) {
        console.error("Error uploading image to Cloudinary:", uploadError);
        return res.status(500).json({ error: "Failed to upload image" });
      }
    }

    const newMessage = new Message({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    await newMessage.save();
    console.log("Message saved to database:", newMessage._id);

    const receiverSocketIds = getAllReceiverSocketIds(receiverId);
    console.log(`Found ${receiverSocketIds.length} active session(s) for user ${receiverId}:`, receiverSocketIds);
    
    if (receiverSocketIds.length > 0) {
      // Send message to all sessions of the receiver
      receiverSocketIds.forEach(socketId => {
        console.log(`Sending message to socket ${socketId}`);
        io.to(socketId).emit("newMessage", newMessage);
      });
      console.log(`Message sent to ${receiverSocketIds.length} session(s) of user ${receiverId}`);
    } else {
      console.log(`No active sessions found for user ${receiverId}`);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};