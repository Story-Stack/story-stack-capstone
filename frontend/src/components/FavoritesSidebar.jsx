import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import "./FavoritesSidebar.css";

function Sidebar() {
  const [favoritesCount, setFavoritesCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadFavoritesCount();
    } else {
      setFavoritesCount(0);
    }
  }, [user]);

  const loadFavoritesCount = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/favorites/${user.id}`
      );

      if (response.ok) {
        const favoritesData = await response.json();
        setFavoritesCount(favoritesData.length);
      } else {
        setFavoritesCount(0);
      }
    } catch (error) {
      console.error("Error loading favorites count:", error);
      setFavoritesCount(0);
    }
  };

  const handleFavoritesClick = () => {
    if (!user) {
      alert("Please sign in to view favorites");
      return;
    }
    navigate("/favorites");
  };

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <button className="sidebar-tab" onClick={handleFavoritesClick}>
          <span className="tab-icon">❤️</span>
          <span className="tab-text">My Favorites</span>
          {favoritesCount > 0 && (
            <span className="tab-count">{favoritesCount}</span>
          )}
        </button>

        {/* Add more navigation tabs here in the future */}
        <button className="sidebar-tab" disabled>
          <span className="tab-icon">📚</span>
          <span className="tab-text">My Shelf</span>
        </button>

        <button className="sidebar-tab" disabled>
          <span className="tab-icon">📖</span>
          <span className="tab-text">Reading List</span>
        </button>
      </nav>
    </div>
  );
}

export default Sidebar;
