import { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContextDefinition";
import { ChatContext } from "../../context/ChatContextDefinition";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);

  const [input, setInput] = useState("");

  const navigate = useNavigate();

  const filteredUsers = input.trim()
    ? users.filter((user) =>
        user.fullName?.toLowerCase().includes(input.toLowerCase())
      )
    : users;

  useEffect(() => {
    getUsers();
  }, [getUsers, onlineUsers]);

  return (
    <div
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-scroll text-white ${
        selectedUser ? "max-md:hidden" : ""
      }`}
    >
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img src={assets.logo} alt="logo" className="max-w-36 drop-shadow" />
          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="menu"
              className="max-h-5 cursor-pointer hover:opacity-80 transition-opacity"
            />
            <div className="absolute top-full right-0 z-20 w-36 p-4 rounded-xl bg-[#282142] border border-gray-600 text-gray-100 hidden group-hover:block shadow-xl">
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer text-sm hover:text-violet-300 py-1 transition-colors"
              >
                Edit Profile
              </p>
              <hr className="my-2 border-t border-gray-600" />
              <p
                onClick={() => logout()}
                className="cursor-pointer text-sm hover:text-red-400 py-1 transition-colors"
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-2.5 px-4 mt-5 border border-gray-700/50">
          <img src={assets.search_icon} alt="Search" className="w-3.5 opacity-70" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            type="text"
            className="bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1"
            placeholder="Search User..."
          />
          {input && (
            <button
              onClick={() => setInput("")}
              className="text-xs text-gray-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-xs">
            {input.trim() ? "No contacts matching search" : "No other contacts yet"}
          </div>
        ) : (
          filteredUsers.map((user, index) => {
            const isUserOnline =
              user.isAI ||
              user.email === "spaceai@system.local" ||
              user.fullName === "SpaceAI" ||
              onlineUsers.includes(user._id);

            return (
              <div
                onClick={() => {
                  setSelectedUser(user);
                  setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
                }}
                key={user._id || index}
                className={`relative flex items-center gap-3 p-2.5 px-3 rounded-xl cursor-pointer transition-all duration-150 max-sm:text-sm hover:bg-[#282142]/40 ${
                  selectedUser?._id === user._id ? "bg-[#282142]/80 border border-violet-500/30" : ""
                }`}
              >
                <div className="relative">
                  <img
                    src={user?.profilePic || assets.avatar_icon}
                    alt="profile"
                    className="w-10 h-10 rounded-full object-cover border border-violet-400/40"
                  />
                  {isUserOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#1c1830]"></span>
                  )}
                </div>
                <div className="flex flex-col leading-tight flex-1 overflow-hidden">
                  <p className="font-medium text-sm text-white truncate flex items-center gap-1.5">
                    {user.fullName}
                    {user.isAI && (
                      <span className="text-[10px] bg-violet-600/60 text-violet-200 px-1.5 py-0.5 rounded-full font-normal">
                        AI
                      </span>
                    )}
                  </p>
                  <span
                    className={`text-xs ${
                      isUserOnline ? "text-green-400" : "text-neutral-400"
                    }`}
                  >
                    {isUserOnline ? "Online" : "Offline"}
                  </span>
                </div>
                {unseenMessages?.[user._id] > 0 && (
                  <p className="text-xs h-5 min-w-5 px-1.5 flex justify-center items-center rounded-full bg-violet-600 text-white font-semibold shadow">
                    {unseenMessages[user._id]}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Sidebar;
