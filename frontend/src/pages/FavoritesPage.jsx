import { useState, useEffect } from "react";
import { useAuth } from "../App";
import BookCard from "../BookCard";
import "./FavoritesPage.css";

function FavoritesPage() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/favorites/${user.id}`
      );

      if (response.ok) {
        const favoritesData = await response.json();
        setFavorites(favoritesData);
      } else {
        console.error("Failed to load favorites");
        setFavorites([]);
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromFavorites = async (book) => {
    if (!user) return;

    try {
      const response = await fetch("http://localhost:3000/api/favorites", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supabase_id: user.id,
          book_id: book.id,
        }),
      });

      if (response.ok) {
        setFavorites((prev) => prev.filter((fav) => fav.book_id !== book.id));
        console.log("Removed from favorites:", book.volumeInfo?.title);
      } else {
        console.error("Failed to remove from favorites");
        alert("Failed to remove from favorites. Please try again.");
      }
    } catch (error) {
      console.error("Error removing favorite:", error);
      alert("Network error. Please try again.");
    }
  };

  const handleToggleToShelf = async (book) => {
    console.log("Toggle shelf for:", book.volumeInfo?.title);
  };

  if (!user) {
    return (
      <div className="favorites-page">
        <div className="favorites-header">
          <h1>My Favorites</h1>
        </div>
        <div className="no-user-message">
          <p>Please sign in to view your favorites</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="favorites-page">
        <div className="favorites-header">
          <h1>My Favorites</h1>
        </div>
        <div className="loading-message">
          <p>Loading your favorites...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h1>My Favorites ({favorites.length})</h1>
        <p>Books you've added to your favorites collection</p>
      </div>

      {favorites.length === 0 ? (
        <div className="no-favorites-message">
          <h2>No favorites yet!</h2>
          <p>
            Start exploring books and add them to your favorites by clicking the
            heart icon.
          </p>
          <a href="/dashboard" className="browse-books-btn">
            Browse Books
          </a>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((favorite) => {
            // Convert the stored favorite back to the book format expected by BookCard
            const book = {
              id: favorite.book_id,
              volumeInfo: {
                title: favorite.book_title,
                authors: favorite.book_data?.volumeInfo?.authors || [
                  "Unknown Author",
                ],
                imageLinks: favorite.book_data?.volumeInfo?.imageLinks || {},
                description: favorite.book_data?.volumeInfo?.description || "",
                publishedDate:
                  favorite.book_data?.volumeInfo?.publishedDate || "",
                publisher: favorite.book_data?.volumeInfo?.publisher || "",
                pageCount: favorite.book_data?.volumeInfo?.pageCount || 0,
                categories: favorite.book_data?.volumeInfo?.categories || [],
                averageRating:
                  favorite.book_data?.volumeInfo?.averageRating || 0,
                ratingsCount: favorite.book_data?.volumeInfo?.ratingsCount || 0,
              },
            };

            return (
              <BookCard
                key={favorite.book_id}
                book={book}
                isFavorite={true}
                toShelf={false}
                
                onToggleFavorite={() => handleRemoveFromFavorites(book)}
                onToggleToShelf={() => handleToggleToShelf(book)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FavoritesPage;
