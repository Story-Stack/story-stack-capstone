import { useState, useEffect } from "react";
import { useAuth } from "../App";
import BookCard from "../BookCard";
import Sidebar from "../components/FavoritesSidebar";
import "./RecommendationsPage.css";

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

      const response = await fetch(
        `http://localhost:3000/api/recommendations/${user.id}`
      );

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

      // Remove duplicates and limit to 20 books
      const uniqueBooks = allBooks
        .filter(
          (book, index, self) =>
            index === self.findIndex((b) => b.id === book.id)
        )
        .slice(0, 20);

      return uniqueBooks;
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

  return (
    <div className="recommendations-page">
      <Sidebar />
      <div className="recommendations-content">
        <h1>Recommended Books For You!</h1>
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
