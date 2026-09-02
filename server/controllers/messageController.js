import Message from "../models/Messages.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import {
  getOrCreateSpaceAIUser,
  isImagePrompt,
  generateAITextReply,
  generateAIImageReply,
  SPACEAI_EMAIL,
} from "../lib/spaceai.js";

// Get all users except the logged in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;

    // Ensure SpaceAI exists
    await getOrCreateSpaceAIUser();

    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password"
    );

    // Count number of messages not seen
    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const count = await Message.countDocuments({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });
      if (count > 0) {
        unseenMessages[user._id] = count;
      }
    });

    await Promise.all(promises);

    res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Get all messages for selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
    });

    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// API to mark messages as seen using message id
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;

    await Message.findByIdAndUpdate(id, { seen: true });

    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

// Send message to selected user
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    // Check if receiver is SpaceAI
    const receiverUser = await User.findById(receiverId);
    const isReceiverAI =
      receiverUser?.isAI || receiverUser?.email === SPACEAI_EMAIL;

    if (isReceiverAI) {
      // Respond to HTTP request immediately so user sees their own message
      res.json({ success: true, newMessage });

      // Asynchronously process AI reply
      (async () => {
        try {
          let aiMessage;

          if (text && isImagePrompt(text)) {
            const imageResult = await generateAIImageReply(text);
            if (imageResult.success) {
              aiMessage = await Message.create({
                senderId: receiverId,
                receiverId: senderId,
                text: "",
                image: imageResult.imageUrl,
                seen: true,
              });
            } else {
              aiMessage = await Message.create({
                senderId: receiverId,
                receiverId: senderId,
                text: imageResult.fallbackText,
                seen: true,
              });
            }
          } else {
            const promptText = text || (imageUrl ? "Analyze this uploaded image" : "Hello SpaceAI");
            const textResult = await generateAITextReply(senderId, promptText);
            aiMessage = await Message.create({
              senderId: receiverId,
              receiverId: senderId,
              text: textResult.success ? textResult.reply : textResult.fallbackText,
              seen: true,
            });
          }

          // Emit to sender socket
          const senderSocketId = userSocketMap[senderId.toString()];
          if (senderSocketId) {
            io.to(senderSocketId).emit("newMessage", aiMessage);
          }
        } catch (aiErr) {
          console.error("Async SpaceAI response error:", aiErr);
          const fallbackMsg = await Message.create({
            senderId: receiverId,
            receiverId: senderId,
            text: "SpaceAI is temporarily unavailable. Please try again.",
            seen: true,
          });
          const senderSocketId = userSocketMap[senderId.toString()];
          if (senderSocketId) {
            io.to(senderSocketId).emit("newMessage", fallbackMsg);
          }
        }
      })();

      return;
    }

    // Normal user-to-user messaging
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

