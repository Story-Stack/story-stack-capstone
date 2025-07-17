import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import "./FavoritesSidebar.css";

function Sidebar() {
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [shelfCount, setShelfCount] = useState(0);
  const [recommendationsCount, setRecommendationsCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadFavoritesCount();
      loadShelfCount();
      loadRecommendationsCount();
    } else {
      setFavoritesCount(0);
      setShelfCount(0);
      setRecommendationsCount(0);
    }
  }, [user]);

  const loadFavoritesCount = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/favorites/${user.id}`);

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

  const loadShelfCount = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/shelf/${user.id}`);

      if (response.ok) {
        const shelfData = await response.json();
        setShelfCount(shelfData.length);
      } else {
        setShelfCount(0);
      }
    } catch (error) {
      console.error("Error loading shelf count:", error);
      setShelfCount(0);
    }
  };

  const loadRecommendationsCount = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/recommendations/${user.id}`);

      if (response.ok) {
        const recommendationsData = await response.json();
        // Check if topCategories exists and use its length
        if (recommendationsData.topCategories) {
          setRecommendationsCount(recommendationsData.topCategories.length);
        } else {
          setRecommendationsCount(0);
        }
      } else {
        setRecommendationsCount(0);
      }
    } catch (error) {
      console.error("Error loading recommendations count:", error);
      setRecommendationsCount(0);
    }
  };

  const handleFavoritesClick = () => {
    if (!user) {
      alert("Please sign in to view favorites");
      return;
    }
    navigate("/favorites");
  };

  const handleShelfClick = () => {
    if (!user) {
      alert("Please sign in to view shelf");
      return;
    }
    navigate("/shelf");
  };

  const handleRecommendationsClick = () => {
    if (!user) {
      alert("Please sign in to view recommendations");
      return;
    }
    navigate("/recommendations");
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

        <button className="sidebar-tab" onClick={handleShelfClick}>
          <span className="tab-icon">📚</span>
          <span className="tab-text">My Shelf</span>
          {shelfCount > 0 && <span className="tab-count">{shelfCount}</span>}
        </button>

        <button className="sidebar-tab" onClick={handleRecommendationsClick}>
          <span className="tab-icon">🎯</span>
          <span className="tab-text">My Recommendations</span>
          {/* {recommendationsCount > 0 && (
            <span className="tab-count">{recommendationsCount}</span>
          )} */}
        </button>
      </nav>
    </div>
  );
}

export default Sidebar;
