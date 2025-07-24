import { useState, useEffect } from "react";
import { useAuth } from "../App";
import Sidebar from "../components/FavoritesSidebar";
import "./ProfilePage.css";

function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [joinedChannels, setJoinedChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bioEditing, setBioEditing] = useState(false);
  const [bioText, setBioText] = useState("");
  const [bioSaving, setBioSaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchJoinedChannels();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/supabase/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setUserData(data);
        setBioText(data.bio || "");
      } else {
        console.error("Failed to fetch user data");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJoinedChannels = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/user-channels/user/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setJoinedChannels(data);
      } else {
        console.error("Failed to fetch joined channels");
      }
    } catch (error) {
      console.error("Error fetching joined channels:", error);
    }
  };

  const handleBioEdit = () => {
    setBioEditing(true);
  };

  const handleBioSave = async () => {
    if (!user) return;

    setBioSaving(true);
    try {
      const response = await fetch(`/api/users/${userData.supabase_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ bio: bioText }),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUserData(updatedUser);
        setBioEditing(false);
      } else {
        console.error("Failed to update bio");
      }
    } catch (error) {
      console.error("Error updating bio:", error);
    } finally {
      setBioSaving(false);
    }
  };

  const handleBioCancel = () => {
    setBioText(userData?.bio || "");
    setBioEditing(false);
  };

  const handleJoinDiscussion = (channelId) => {
    window.location.href = `/discussion/${channelId}`;
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div className="profile-page">
      <div className="sidebar-container">
        <Sidebar />
      </div>
      <div className="profile-content">
        <div className="profile-header">
          <h1>My Profile</h1>
        </div>

        <div className="profile-section">
          <h2>User Information</h2>
          {userData ? (
            <div className="user-info">
              <p>
                <strong>Name:</strong> {userData.first_name || ""}{" "}
                {userData.last_name || ""}
              </p>
              <p>
                <strong>Email:</strong> {userData.email}
              </p>
              <p>
                <strong>Member since:</strong>{" "}
                {new Date(userData.created_at).toLocaleDateString()}
              </p>
            </div>
          ) : (
            <p>No user information available</p>
          )}
        </div>

        <div className="profile-section">
          <div className="bio-header">
            <h2>Bio</h2>
            {!bioEditing && (
              <button onClick={handleBioEdit} className="edit-bio-btn">
                {userData?.bio ? "Edit" : "Add Bio"}
              </button>
            )}
          </div>

          {bioEditing ? (
            <div className="bio-edit">
              <textarea
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Tell us about yourself..."
                rows={4}
                className="bio-textarea"
              />
              <div className="bio-actions">
                <button
                  onClick={handleBioSave}
                  className="save-bio-btn"
                  disabled={bioSaving}
                >
                  {bioSaving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleBioCancel}
                  className="cancel-bio-btn"
                  disabled={bioSaving}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bio-display">
              {userData?.bio ? (
                <p>{userData.bio}</p>
              ) : (
                <p className="no-bio">No bio added yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="profile-section">
          <h2>Book Discussions Joined</h2>
          {joinedChannels.length > 0 ? (
            <ul className="channels-list">
              {joinedChannels.map((channel) => (
                <li key={channel.id} className="channel-item">
                  <div className="channel-info">
                    <span className="channel-title">{channel.title}</span>
                    <span className="channel-author">by {channel.author}</span>
                    <span className="channel-joined">
                      Joined: {new Date(channel.joined_at).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    className="join-discussion-btn"
                    onClick={() => handleJoinDiscussion(channel.id)}
                  >
                    Join Discussion
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>You haven't joined any book discussions yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
