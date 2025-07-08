import { useState, useEffect } from "react";
import { useAuth } from "../App";
import BookCard from "../BookCard";
import "./ShelfPage.css";
import { useNavigate } from "react-router-dom";

function ShelfPage() {
  const [shelf, setShelf] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadShelf();
    } else {
      setShelf([]);
      setLoading(false);
    }
  }, [user]);

  const loadShelf = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3000/api/shelf/${user.id}`
      );

      if (response.ok) {
        const shelfData = await response.json();
        setShelf(shelfData);
      } else {
        setShelf([]);
      }
    } catch (error) {
      setShelf([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromShelf = async (book) => {
    if (!user) return;

    try {
      const response = await fetch("http://localhost:3000/api/shelf", {
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
        // Remove from local state
        setShelf((prev) => prev.filter((item) => item.book_id !== book.id));
      } else {
        alert("Failed to remove from shelf. Please try again.");
      }
    } catch (error) {
      alert("Network error. Please try again.");
    }
  };

  const handleToggleToShelf = async (book) => {
  };

  if (!user) {
    return (
      <div className="shelf-page">
        <div className="shelf-header">
          <h1>My Shelf</h1>
        </div>
        <div className="no-user-message">
          <p>Please sign in to view your shelf</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="shelf-page">
        <div className="shelf-header">
          <h1>My Shelf</h1>
        </div>
        <div className="loading-message">
          <p>Loading your Shelf...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="shelf-page">
      <button onClick={() => navigate("/dashboard")}>❮ Previous</button>
      <div className="shelf-header">
        <h1>My Shelf ({shelf.length})</h1>
        <p>Books you've added to your shelf collection</p>
      </div>

      {shelf.length === 0 ? (
        <div className="no-books-message">
          <h2>No books added to shelf yet!</h2>
          <p>
            Start exploring books and add them to your shelf by clicking the
            shelf icon.
          </p>
          <a href="/dashboard" className="browse-books-btn">
            Browse Books
          </a>
        </div>
      ) : (
        <div className="shelf-grid">
          {shelf.map((shelfItem) => {
            // Convert the stored shelf item back to the book format expected by BookCard
            const book = {
              id: shelfItem.book_id,
              volumeInfo: {
                title: shelfItem.book_title,
                authors: shelfItem.book_data?.volumeInfo?.authors || [
                  "Unknown Author",
                ],
                imageLinks: shelfItem.book_data?.volumeInfo?.imageLinks || {},
                description: shelfItem.book_data?.volumeInfo?.description || "",
                publishedDate:
                  shelfItem.book_data?.volumeInfo?.publishedDate || "",
                publisher: shelfItem.book_data?.volumeInfo?.publisher || "",
                pageCount: shelfItem.book_data?.volumeInfo?.pageCount || 0,
                categories: shelfItem.book_data?.volumeInfo?.categories || [],
                averageRating:
                  shelfItem.book_data?.volumeInfo?.averageRating || 0,
                ratingsCount:
                  shelfItem.book_data?.volumeInfo?.ratingsCount || 0,
              },
            };

            return (
              <BookCard
                key={shelfItem.book_id}
                book={book}
                isFavorite={false}
                toShelf={true} // Always true since this is the shelf page
                onToggleFavorite={() => handleToggleToShelf(book)}
                onToggleToShelf={() => handleRemoveFromShelf(book)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ShelfPage;
