import { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils";
import { ChatContext } from "../../context/ChatContextDefinition";
import { AuthContext } from "../../context/AuthContextDefinition";
import toast from "react-hot-toast";

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    isAiTyping,
  } = useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);

  const scrollEnd = useRef();

  const [input, setInput] = useState("");
  const [isSendingImage, setIsSendingImage] = useState(false);

  const isSelectedUserAI =
    selectedUser?.isAI ||
    selectedUser?.email === "spaceai@system.local" ||
    selectedUser?.fullName === "SpaceAI";

  // Helper to format **bold** text inside chat messages
  const renderFormattedText = (text) => {
    if (!text) return null;
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
        return (
          <strong key={i} className="font-bold text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  // Handle sending a message
  const handleSendMessage = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const textToSend = input.trim();
    if (!textToSend) return;

    setInput("");
    await sendMessage({ text: textToSend });
  };

  // Handle sending an image
  const handleSendImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (.png, .jpg, .jpeg)");
      return;
    }

    setIsSendingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await sendMessage({ image: reader.result });
      } catch (err) {
        console.error(err);
      } finally {
        setIsSendingImage(false);
        e.target.value = "";
      }
    };

    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (selectedUser) {
      getMessages(selectedUser._id);
    }
  }, [getMessages, selectedUser]);

  useEffect(() => {
    if (scrollEnd.current && (messages || isAiTyping || isSendingImage)) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAiTyping, isSendingImage]);

  return selectedUser ? (
    <div className="h-full overflow-hidden relative backdrop-blur-lg flex flex-col justify-between">
      {/* --------- header --------- */}
      <div className="flex items-center gap-3 py-3 mx-4 border-b border-gray-700">
        <div className="relative">
          <img
            src={selectedUser.profilePic || assets.avatar_icon}
            alt="profile"
            className="w-10 h-10 rounded-full object-cover border border-violet-400/50"
          />
          {(isSelectedUserAI || onlineUsers.includes(selectedUser._id)) && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#1c1830]"></span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-base font-medium text-white flex items-center gap-2">
            {selectedUser.fullName}
            {isSelectedUserAI && (
              <span className="text-[10px] bg-violet-600/60 text-violet-200 px-2 py-0.5 rounded-full font-normal">
                AI Assistant
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400">
            {isSelectedUserAI || onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
          </p>
        </div>
        <img
          onClick={() => setSelectedUser(null)}
          src={assets.arrow_icon}
          alt="arrow"
          className="md:hidden max-w-7 cursor-pointer hover:opacity-80 transition-opacity"
        />
      </div>

      {/* --------- chat area --------- */}
      <div className="flex-1 overflow-y-scroll p-4 space-y-4">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === authUser._id;
          return (
            <div
              key={msg._id || index}
              className={`flex items-end gap-2.5 ${isMe ? "justify-end" : "justify-start"}`}
            >
              {!isMe && (
                <img
                  src={selectedUser?.profilePic || assets.avatar_icon}
                  alt="profile"
                  className="w-7 h-7 rounded-full object-cover border border-gray-600 flex-shrink-0 mb-1"
                />
              )}

              <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%] md:max-w-[70%]`}>
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt="attachment"
                    className="max-w-[260px] md:max-w-[340px] rounded-2xl border border-gray-700/60 shadow-lg object-cover cursor-pointer hover:opacity-95 transition-opacity"
                    onClick={() => window.open(msg.image, "_blank")}
                  />
                ) : (
                  <div
                    className={`p-3 px-4 text-sm font-light rounded-2xl whitespace-pre-wrap break-words shadow-md ${
                      isMe
                        ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white rounded-br-none"
                        : "bg-[#282142] text-gray-100 rounded-bl-none border border-gray-700/50"
                    }`}
                  >
                    {renderFormattedText(msg.text)}
                  </div>
                )}

                <span className="text-[10px] text-gray-500 mt-1 px-1">
                  {formatMessageTime(msg.createdAt)}
                </span>
              </div>

              {isMe && (
                <img
                  src={authUser?.profilePic || assets.avatar_icon}
                  alt="profile"
                  className="w-7 h-7 rounded-full object-cover border border-violet-500/50 flex-shrink-0 mb-1"
                />
              )}
            </div>
          );
        })}

        {isSendingImage && (
          <div className="flex items-end gap-2.5 justify-end">
            <div className="p-3 px-4 rounded-2xl bg-purple-600/40 text-violet-200 text-xs flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-violet-300 border-t-transparent rounded-full animate-spin"></span>
              <span>Uploading image...</span>
            </div>
          </div>
        )}

        {isAiTyping && isSelectedUserAI && (
          <div className="flex items-end gap-2.5 justify-start">
            <img
              src={selectedUser?.profilePic || assets.avatar_icon}
              alt="profile"
              className="w-7 h-7 rounded-full object-cover border border-gray-600 flex-shrink-0"
            />
            <div className="p-3 px-4 rounded-2xl rounded-bl-none bg-[#282142] border border-violet-500/30 text-violet-200 flex items-center gap-2">
              <span className="text-xs text-violet-300 font-medium">SpaceAI is thinking...</span>
              <span className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-bounce [animation-delay:0.4s]"></span>
              </span>
            </div>
          </div>
        )}

        <div ref={scrollEnd}></div>
      </div>

      {/* --------- bottom area --------- */}
      <div className="p-3 border-t border-gray-700/60 bg-[#161224]/80 backdrop-blur-md">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2.5">
          <div className="flex-1 flex items-center bg-[#282142] border border-gray-700/60 px-4 py-1.5 rounded-full focus-within:border-violet-500 transition-colors">
            <input
              onChange={(e) => setInput(e.target.value)}
              value={input}
              type="text"
              placeholder={isSelectedUserAI ? "Ask SpaceAI anything or say 'generate an image of...'" : "Type a message..."}
              className="flex-1 text-sm py-2 bg-transparent border-none outline-none text-white placeholder-gray-400"
            />
            <input
              onChange={handleSendImage}
              type="file"
              id="image"
              accept="image/png, image/jpeg, image/jpg"
              hidden
              disabled={isSendingImage}
            />
            <label htmlFor="image" className="cursor-pointer hover:opacity-80 transition-opacity">
              <img
                src={assets.gallery_icon}
                alt="gallery"
                className="w-5 ml-2"
              />
            </label>
          </div>
          <button
            type="submit"
            disabled={!input.trim()}
            className="p-2.5 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-full transition-all shadow-md cursor-pointer disabled:opacity-40"
          >
            <img
              src={assets.send_button}
              alt="send"
              className="w-5 h-5"
            />
          </button>
        </form>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-3 text-gray-400 bg-white/5 backdrop-blur-lg p-6 max-md:hidden h-full">
      <img src={assets.logo_icon} alt="logo" className="max-w-20 opacity-80 animate-pulse" />
      <h3 className="text-xl font-semibold text-white">Welcome to Quick Chat</h3>
      <p className="text-sm text-gray-400 text-center max-w-sm">
        Select a contact from the sidebar or chat with <span className="text-violet-400 font-medium">SpaceAI</span> to get started.
      </p>
    </div>
  );
};

export default ChatContainer;
