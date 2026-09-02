import { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import { ChatContext } from "../../context/ChatContextDefinition";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);

  return (
    <div className="w-full h-screen sm:px-[5%] md:px-[8%] lg:px-[12%] sm:py-[3%] md:py-[4%] flex items-center justify-center p-2">
      <div
        className={`w-full max-w-6xl h-full max-h-[850px] backdrop-blur-2xl bg-black/40 border-2 border-gray-600 rounded-2xl overflow-hidden grid grid-cols-1 relative shadow-2xl ${
          selectedUser
            ? "md:grid-cols-[1fr_1.6fr_1fr] lg:grid-cols-[1fr_2fr_1.1fr]"
            : "md:grid-cols-2"
        }`}
      >
        <Sidebar />
        <ChatContainer />
        <RightSidebar />
      </div>
    </div>
  );
};

export default HomePage;
