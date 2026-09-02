import Message from "../models/Messages.js";
import {
  getOrCreateSpaceAIUser,
  generateAITextReply,
  generateAIImageReply,
  isImagePrompt,
} from "../lib/spaceai.js";
import { io, userSocketMap } from "../server.js";

/**
 * Handle AI Chat via dedicated endpoint
 * POST /api/ai/chat
 */
export const aiChat = async (req, res) => {
  try {
    const { message, prompt } = req.body;
    const userPrompt = message || prompt;
    const userId = req.user._id;

    if (!userPrompt || userPrompt.trim() === "") {
      return res.json({ success: false, message: "Prompt or message is required" });
    }

    const spaceAIUser = await getOrCreateSpaceAIUser();

    // Save user's message
    const userMessage = await Message.create({
      senderId: userId,
      receiverId: spaceAIUser._id,
      text: userPrompt.trim(),
    });

    let aiMessage;
    let replyText = "";
    let imageUrl = null;

    if (isImagePrompt(userPrompt)) {
      const imgResult = await generateAIImageReply(userPrompt);
      if (imgResult.success) {
        imageUrl = imgResult.imageUrl;
        aiMessage = await Message.create({
          senderId: spaceAIUser._id,
          receiverId: userId,
          text: "",
          image: imageUrl,
          seen: true,
        });
      } else {
        replyText = imgResult.fallbackText;
        aiMessage = await Message.create({
          senderId: spaceAIUser._id,
          receiverId: userId,
          text: replyText,
          seen: true,
        });
      }
    } else {
      const textResult = await generateAITextReply(userId, userPrompt);
      replyText = textResult.success ? textResult.reply : textResult.fallbackText;
      aiMessage = await Message.create({
        senderId: spaceAIUser._id,
        receiverId: userId,
        text: replyText,
        seen: true,
      });
    }

    // Emit real-time notification
    const senderSocketId = userSocketMap[userId.toString()];
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", aiMessage);
    }

    return res.json({
      success: true,
      reply: replyText,
      image: imageUrl,
      userMessage,
      aiMessage,
    });
  } catch (error) {
    console.error("AI Chat Controller Error:", error.message);
    return res.json({
      success: false,
      message: "SpaceAI is temporarily unavailable. Please try again.",
    });
  }
};

/**
 * Handle AI Image Generation via dedicated endpoint
 * POST /api/ai/generate-image
 */
export const aiGenerateImage = async (req, res) => {
  try {
    const { prompt } = req.body;
    const userId = req.user._id;

    if (!prompt || prompt.trim() === "") {
      return res.json({ success: false, message: "Image prompt is required" });
    }

    const spaceAIUser = await getOrCreateSpaceAIUser();

    // Save user's message
    const userMessage = await Message.create({
      senderId: userId,
      receiverId: spaceAIUser._id,
      text: prompt.trim(),
    });

    const imgResult = await generateAIImageReply(prompt);
    let aiMessage;

    if (imgResult.success) {
      aiMessage = await Message.create({
        senderId: spaceAIUser._id,
        receiverId: userId,
        text: "",
        image: imgResult.imageUrl,
        seen: true,
      });
    } else {
      aiMessage = await Message.create({
        senderId: spaceAIUser._id,
        receiverId: userId,
        text: imgResult.fallbackText,
        seen: true,
      });
    }

    const senderSocketId = userSocketMap[userId.toString()];
    if (senderSocketId) {
      io.to(senderSocketId).emit("newMessage", aiMessage);
    }

    return res.json({
      success: imgResult.success,
      imageUrl: imgResult.imageUrl || null,
      message: imgResult.success ? "Image generated successfully" : imgResult.fallbackText,
      userMessage,
      aiMessage,
    });
  } catch (error) {
    console.error("AI Generate Image Controller Error:", error.message);
    return res.json({
      success: false,
      message: "SpaceAI image generation is temporarily unavailable.",
    });
  }
};
