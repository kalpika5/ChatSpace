import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import assets from "../assets/assets";
import { AuthContext } from "../../context/AuthContextDefinition";

const ProfilePage = () => {
  const { authUser, updateProfile } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedImg, setSelectedImg] = useState(null);
  const [name, setName] = useState(authUser?.fullName || "");
  const [bio, setBio] = useState(authUser?.bio || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authUser) {
      setName(authUser.fullName || "");
      setBio(authUser.bio || "");
    }
  }, [authUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (!selectedImg) {
        await updateProfile({ fullName: name, bio });
        navigate("/");
        return;
      }

      const reader = new FileReader();
      reader.readAsDataURL(selectedImg);
      reader.onload = async () => {
        const base64Image = reader.result;
        await updateProfile({ profilePic: base64Image, fullName: name, bio });
        navigate("/");
      };
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-no-repeat flex items-center justify-center p-4">
      <div className="w-full max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-2xl bg-black/40 overflow-hidden shadow-2xl">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-5 p-8 md:p-10 flex-1 w-full"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">Profile details</h3>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <label
            htmlFor="avatar"
            className="flex items-center gap-3 cursor-pointer group"
          >
            <input
              onChange={(e) => setSelectedImg(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <img
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : authUser?.profilePic || assets.avatar_icon
              }
              alt="profile"
              className="w-14 h-14 rounded-full object-cover border border-violet-400 group-hover:opacity-80 transition-opacity"
            />
            <span className="text-sm text-violet-300 group-hover:underline">
              {selectedImg ? "Change selected image" : "Upload profile image"}
            </span>
          </label>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Full Name</label>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              type="text"
              required
              placeholder="Your name"
              className="p-3 bg-white/5 border border-gray-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-400">Bio</label>
            <textarea
              onChange={(e) => setBio(e.target.value)}
              value={bio}
              placeholder="Write profile bio..."
              required
              className="p-3 bg-white/5 border border-gray-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-none"
              rows={4}
            ></textarea>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white py-3 rounded-full text-sm font-medium transition-all shadow-lg cursor-pointer disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="px-6 py-3 border border-gray-500 hover:bg-white/5 text-gray-300 rounded-full text-sm transition-colors cursor-pointer"
            >
              Back
            </button>
          </div>
        </form>

        <div className="flex flex-col items-center justify-center p-6 sm:p-10 border-b sm:border-b-0 sm:border-l border-gray-700">
          <img
            className="w-36 h-36 sm:w-44 sm:h-44 aspect-square rounded-full object-cover border-2 border-violet-500 shadow-lg"
            src={
              selectedImg
                ? URL.createObjectURL(selectedImg)
                : authUser?.profilePic || assets.avatar_icon
            }
            alt="User avatar preview"
          />
          <p className="mt-3 text-xs text-gray-400">{authUser?.email || ""}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
