import { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { ChatContext } from "../../context/ChatContextDefinition";
import { AuthContext } from "../../context/AuthContextDefinition";

const RightSidebar = () => {
  const { selectedUser, messages } = useContext(ChatContext);
  const { logout, onlineUsers } = useContext(AuthContext);
  const [msgImages, setMsgImages] = useState([]);

  // Get all the images from the messages and set them to state
  useEffect(() => {
    setMsgImages(messages.filter((msg) => msg.image).map((msg) => msg.image));
  }, [messages]);

  return (
    selectedUser && (
      <div
        className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll flex flex-col justify-between p-5 ${
          selectedUser ? "max-md:hidden" : ""
        }`}
      >
        <div className="flex flex-col items-center gap-2 text-xs font-light mx-auto pt-6 text-center w-full">
          <div className="relative">
            <img
              src={selectedUser?.profilePic || assets.avatar_icon}
              alt="profile"
              className="w-20 h-20 aspect-square rounded-full object-cover border-2 border-violet-400/60 shadow-lg"
            />
            {(selectedUser.isAI ||
              selectedUser.email === "spaceai@system.local" ||
              selectedUser.fullName === "SpaceAI" ||
              onlineUsers.includes(selectedUser._id)) && (
              <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#1c1830]"></span>
            )}
          </div>
          <h2 className="text-lg font-semibold text-white mt-1 flex items-center justify-center gap-2">
            {selectedUser.fullName}
          </h2>
          <p className="text-gray-300 text-xs px-4 line-clamp-3">
            {selectedUser.bio || "No bio available."}
          </p>
        </div>

        <hr className="border-gray-700/60 my-4" />

        <div className="flex-1 px-2 text-xs">
          <div className="flex justify-between items-center mb-2">
            <p className="text-gray-400 font-medium uppercase tracking-wider text-[11px]">
              Shared Media ({msgImages.length})
            </p>
          </div>
          {msgImages.length === 0 ? (
            <p className="text-neutral-500 text-xs py-4 text-center">No images shared yet</p>
          ) : (
            <div className="max-h-[220px] overflow-y-scroll grid grid-cols-2 gap-2">
              {msgImages.map((url, index) => (
                <div
                  key={index}
                  onClick={() => window.open(url, "_blank")}
                  className="cursor-pointer rounded-lg overflow-hidden border border-gray-700/60 aspect-square hover:opacity-80 transition-opacity"
                >
                  <img src={url} alt="Shared media" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-6 pb-2 text-center">
          <button
            onClick={logout}
            className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white rounded-full text-xs font-medium transition-all shadow-md cursor-pointer"
          >
            Logout
          </button>
        </div>
      </div>
    )
  );
};

export default RightSidebar;
