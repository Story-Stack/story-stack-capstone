import "./Dashboard.css";
import Search from "../Search";
import BookList from "../BookList";
import Sidebar from "../components/FavoritesSidebar";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabaseClient";

function Dashboard() {
  // books is the list of results received from the Search component
  // setBooks is a function to update the list of results
  const [books, setBooks] = useState([]);
  const [isShowingHotPicks, setIsShowingHotPicks] = useState(true);
  const navigate = useNavigate();

  // Popular book categories that rotate
  const hotPicksCategories = [
    "bestseller fiction",
    "popular science",
    "mystery thriller",
    "romance novels",
    "fantasy adventure",
    "biography memoir",
    "self help",
    "young adult",
    "historical fiction",
    "contemporary literature",
  ];

  // Load hot picks on component mount and set up rotation
  useEffect(() => {
    loadHotPicks();

    // Rotate hot picks every 30 minutes (1800000 ms)
    const interval = setInterval(() => {
      if (isShowingHotPicks) {
        loadHotPicks();
      }
    }, 1800000);

    return () => clearInterval(interval);
  }, [isShowingHotPicks]);

  const loadHotPicks = async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;

    // Select a random category
    const randomCategory =
      hotPicksCategories[Math.floor(Math.random() * hotPicksCategories.length)];

    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          randomCategory
        )}&orderBy=relevance&key=${apiKey}&maxResults=30`
      );
      const data = await response.json();

      const hotPicks = data.items || [];

      // Filter out books that don't have preview images
      const booksWithImages = hotPicks.filter((book) => {
        return (
          book.volumeInfo?.imageLinks &&
          Object.keys(book.volumeInfo.imageLinks).length > 0
        );
      });

      // Shuffle the results to add more randomness
      const shuffledPicks = booksWithImages.sort(() => Math.random() - 0.5);

      setBooks(shuffledPicks);
      setIsShowingHotPicks(true);
    } catch (error) {
      console.error("Error fetching hot picks:", error);
      setBooks([]);
    }
  };

  const handleResults = (results) => {
    setBooks(results); // update the list of results
    setIsShowingHotPicks(false); // User searched, no longer showing hot picks
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const refreshHotPicks = () => {
    loadHotPicks();
  };

  return (
    <div className="dashboard">
      <header>
        <h1>Dashboard</h1>
        <button onClick={handleLogout}>Logout</button>
      </header>

      <Search onResults={handleResults} />

      {/* Hot Picks Header */}
      {isShowingHotPicks && (
        <div className="hot-picks-header">
          <h2>🔥 Hot Picks for You</h2>
          <button onClick={refreshHotPicks} className="refresh-btn">
            🔄 Refresh Picks
          </button>
        </div>
      )}

      <div className="page-layout">
        <aside className="left-sidebar">
          <Sidebar />
        </aside>

        <main className="main-content">
          <BookList books={books} />
        </main>

        <aside className="right-sidebar">{/* Channels */}</aside>
      </div>
    </div>
  );
}

export default Dashboard;
