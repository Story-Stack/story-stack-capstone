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
  const [joinedDiscussions, setJoinedDiscussions] = useState(() => {
    // Load joined discussions from localStorage on component mount
    const saved = localStorage.getItem('joinedDiscussions');
    return saved ? JSON.parse(saved) : [];
  });
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

  // Load hot picks on component mount only
  useEffect(() => {
    loadHotPicks();
  }, []);

  // Save joined discussions to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('joinedDiscussions', JSON.stringify(joinedDiscussions));
  }, [joinedDiscussions]);

  // Set up rotation interval when showing hot picks
  useEffect(() => {
    if (!isShowingHotPicks) return;

    // Rotate hot picks every 30 minutes (1800000 ms)
    const interval = setInterval(() => {
      loadHotPicks();
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
    if (results.length === 0) {
      // Search was cleared, return to hot picks
      loadHotPicks();
    } else {
      // User searched and got results
      setBooks(results);
      setIsShowingHotPicks(false);
    }
  };

  const refreshHotPicks = () => {
    loadHotPicks();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleJoinDiscussion = (book) => {
    const { title, authors } = book.volumeInfo;
    const discussionItem = {
      id: book.id,
      title: title,
      author: authors ? authors.join(", ") : "Unknown",
      displayText: `${title} - ${authors ? authors.join(", ") : "Unknown"}`,
    };

    // Check if already joined
    const existingDiscussion = joinedDiscussions.find(
      (item) => item.id === book.id
    );

    if (existingDiscussion) {
      // Leave discussion - remove from list
      setJoinedDiscussions((prev) =>
        prev.filter((item) => item.id !== book.id)
      );
    } else {
      // Join discussion - add to list
      setJoinedDiscussions((prev) => [...prev, discussionItem]);
    }
  };

  const handleLeaveDiscussion = (discussionId, event) => {
    event.stopPropagation(); // Prevent navigation when clicking leave button
    setJoinedDiscussions((prev) =>
      prev.filter((item) => item.id !== discussionId)
    );
  };

  const handleNavigateToDiscussion = (discussionId) => {
    navigate(`/discussion/${discussionId}`);
  };

  const isBookJoined = (bookId) => {
    return joinedDiscussions.some((item) => item.id === bookId);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <button className="previous-btn" onClick={() => navigate("/")}>
          ❮ Previous
        </button>
        <h1 className="page-header">Dashboard</h1>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <Search onResults={handleResults} />

      {/* Hot Picks Header */}
      {isShowingHotPicks && (
        <div className="hot-picks-header">
          <h2>Popular Picks</h2>
        </div>
      )}

      <div className="page-layout">
        <aside className="left-sidebar">
          <Sidebar />
        </aside>

        <main className="main-content">
          <BookList
            books={books}
            onJoinDiscussion={handleJoinDiscussion}
            isBookJoined={isBookJoined}
          />
        </main>


        <div className="right-section">
          <button onClick={refreshHotPicks} className="refresh-btn">
            🔄 Refresh Picks
          </button>

          <aside className="right-sidebar">
            <div className="joined-discussions">
            <h3>Joined Discussions</h3>
            {joinedDiscussions.length === 0 ? (
              <p>No discussions joined yet</p>
            ) : (
              <ul>
                {joinedDiscussions.map((discussion) => (
                  <li
                    key={discussion.id}
                    className="discussion-item"
                    onClick={() => handleNavigateToDiscussion(discussion.id)}
                    title="Click to open discussion"
                  >
                    <span className="discussion-text">
                      {discussion.displayText}
                    </span>
                    <button
                      className="leave-discussion-btn"
                      onClick={(e) => handleLeaveDiscussion(discussion.id, e)}
                      title="Leave discussion"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
