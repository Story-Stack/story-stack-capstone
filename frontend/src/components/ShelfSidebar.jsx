import { useState, useEffect } from "react";
import { useAuth } from "../App";
import { useNavigate } from "react-router-dom";
import "./ShelfSidebar.css";

function Sidebar() {
  const [shelfBooksCount, setShelfBooksCount] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadShelfBooksCount();
    } else {
      setShelfBooksCount(0);
    }
  }, [user]);

  const loadShelfBooksCount = async () => {
    if (!user) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/shelf/${user.id}`
      );

      if (response.ok) {
        const shelfData = await response.json();
        setShelfBooksCount(shelfData.length);
      } else {
        setShelfBooksCount(0);
      }
    } catch (error) {
      console.error("Error loading shelf count:", error);
      setShelfBooksCount(0);
    }
  };

  const handleShelfClick = () => {
    if (!user) {
      alert("Please sign in to view shelf");
      return;
    }
    navigate("/shelf");
  };

  return (
    <div className="sidebar">
      <nav className="sidebar-nav">
        <button className="sidebar-tab" onClick={handleShelfClick}>
          <span className="tab-icon">📚</span>
          <span className="tab-text">My Shelf</span>
          {shelfBooksCount > 0 && (
            <span className="tab-count">{shelfBooksCount}</span>
          )}
        </button>
      </nav>
    </div>
  );
}

export default Sidebar;
