import { useCallback, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContextDefinition";
import toast from "react-hot-toast";
import { ChatContext } from "./ChatContextDefinition";

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [isAiTyping, setIsAiTyping] = useState(false);

  const { socket, axios } = useContext(AuthContext);

  // Function to get all users for sidebar
  const getUsers = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/messages/users");

      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, [axios]);

  // Function to get messages for selected user
  const getMessages = useCallback(async (userId) => {
    try {
      setIsAiTyping(false);
      const { data } = await axios.get(`/api/messages/${userId}`);

      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message);
    }
  }, [axios]);

  // Function to send message to selected user
  const sendMessage = async (messageData) => {
    try {
      const isAI =
        selectedUser?.isAI ||
        selectedUser?.email === "spaceai@system.local" ||
        selectedUser?.fullName === "SpaceAI";

      if (isAI) {
        setIsAiTyping(true);
      }

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );

      if (data.success) {
        setMessages((prevMessages) => [...prevMessages, data.newMessage]);
      } else {
        setIsAiTyping(false);
        toast.error(data.message);
      }
    } catch (error) {
      setIsAiTyping(false);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        setIsAiTyping(false);
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prevUnseenMessages) => ({
          ...prevUnseenMessages,
          [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
            ? prevUnseenMessages[newMessage.senderId] + 1
            : 1,
        }));
      }
    };

    socket.on("newMessage", handleNewMessage);
    return () => socket.off("newMessage", handleNewMessage);
  }, [axios, selectedUser, socket]);

  const value = {
    messages,
    users,
    selectedUser,
    getUsers,
    getMessages,
    sendMessage,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
    isAiTyping,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
