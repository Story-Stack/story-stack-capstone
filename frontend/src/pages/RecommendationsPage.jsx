import { useState, useEffect } from "react";
import { useAuth } from "../App";
import BookCard from "../BookCard";
import Sidebar from "../components/FavoritesSidebar";
import "./RecommendationsPage.css";
const recommendationsLimit = 20; // Number of recommendations to return

function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadRecommendations();
    }
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/recommendations/${user.id}`);

      if (response.ok) {
        const data = await response.json();

        // Check if we have topCategories to work with
        if (data.topCategories && data.topCategories.length > 0) {
          // Fetch books from Google Books API based on top categories
          const books = await fetchBooksFromCategories(data.topCategories);
          setRecommendations(books);
        } else {
          // No categories available, set empty recommendations
          setRecommendations([]);
        }
      } else {
        setError("Failed to load recommendations");
      }
    } catch (error) {
      console.error("Error loading recommendations:", error);
      setError("Error loading recommendations");
    } finally {
      setLoading(false);
    }
  };

  // Fisher-Yates shuffle algorithm
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const fetchBooksFromCategories = async (topCategories) => {
    const allBooks = [];

    try {
      // Fetch books for each top category
      for (const categoryData of topCategories.slice(0, 2)) {
        // Use top 2 categories
        const category = categoryData.category;
        const searchQuery = `subject:${category}`;

        const response = await fetch(
          `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
            searchQuery
          )}&maxResults=10&orderBy=relevance`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.items) {
            allBooks.push(...data.items);
          }
        }
      }

      // Remove duplicates
      const uniqueBooks = allBooks.filter(
        (book, index, self) => index === self.findIndex((b) => b.id === book.id)
      );

      // Shuffle the books to randomize the order
      const shuffledBooks = shuffleArray(uniqueBooks).slice(
        0,
        recommendationsLimit
      );

      return shuffledBooks;
    } catch (error) {
      console.error("Error fetching books from Google Books API:", error);
      return [];
    }
  };

  if (!user) {
    return (
      <div className="recommendations-page">
        <Sidebar />
        <div className="recommendations-content">
          <h1>Please sign in to view recommendations</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="recommendations-page">
        <Sidebar />
        <div className="recommendations-content">
          <h1>Loading recommendations...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommendations-page">
        <Sidebar />
        <div className="recommendations-content">
          <h1>Error: {error}</h1>
          <button onClick={loadRecommendations}>Try Again</button>
        </div>
      </div>
    );
  }

  // Function to manually shuffle the recommendations with animation
  const handleShuffle = () => {
    // Add shuffling class to trigger animation
    const gridElement = document.querySelector(".recommendations-grid");
    if (gridElement) {
      gridElement.classList.add("shuffling");

      // Remove the class after animation completes
      setTimeout(() => {
        gridElement.classList.remove("shuffling");
      }, 500); // Match the animation duration
    }

    // Shuffle the recommendations
    setRecommendations(shuffleArray([...recommendations]));
  };

  return (
    <div className="recommendations-page">
      <Sidebar />
      <div className="recommendations-content">
        <div className="recommendations-header">
          <h1>Recommended Books For You!</h1>
          {recommendations.length > 0 && (
            <button className="shuffle-button" onClick={handleShuffle}>
              <span className="shuffle-icon">🔀</span> Shuffle
            </button>
          )}
        </div>
        {recommendations.length === 0 ? (
          <div className="no-recommendations">
            <p>No recommendations available yet.</p>
            <p>
              Add some books to your favorites or shelf to get personalized
              recommendations!
            </p>
          </div>
        ) : (
          <div className="recommendations-grid">
            {recommendations.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default RecommendationsPage;
