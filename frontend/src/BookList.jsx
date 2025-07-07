import "./BookList.css";
import BookCard from "./BookCard";
import { useState, useEffect } from "react";
import { useAuth } from "./App";

function BookList({ books }) {
  const [favorites, setFavorites] = useState(new Set());
  const [shelfItems, setShelfItems] = useState(new Set());
  const { user } = useAuth();

  // Load user's favorites and shelf items from database
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // Clear data when user logs out
      setFavorites(new Set());
      setShelfItems(new Set());
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load favorites
      const favoritesResponse = await fetch(
        `http://localhost:3000/api/favorites/${user.id}`
      );
      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        const favoriteIds = new Set(favoritesData.map((fav) => fav.book_id));
        setFavorites(favoriteIds);
      }

      // Load shelf items
      const shelfResponse = await fetch(
        `http://localhost:3000/api/shelf/${user.id}`
      );
      if (shelfResponse.ok) {
        const shelfData = await shelfResponse.json();
        const shelfIds = new Set(shelfData.map((item) => item.book_id));
        setShelfItems(shelfIds);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleToggleFavorite = async (book) => {
    if (!user) {
      alert("Please sign in to add favorites");
      return;
    }

    const bookId = book.id;
    const isFavorited = favorites.has(bookId);

    try {
      if (isFavorited) {
        // Remove from favorites
        const response = await fetch("http://localhost:3000/api/favorites", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supabase_id: user.id,
            book_id: bookId,
          }),
        });

        if (response.ok) {
          setFavorites((prev) => {
            const newFavorites = new Set(prev);
            newFavorites.delete(bookId);
            return newFavorites;
          });
          console.log("Removed from favorites:", book.volumeInfo.title);
        }
      } else {
        // Add to favorites
        const response = await fetch("http://localhost:3000/api/favorites", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supabase_id: user.id,
            book_id: bookId,
            book_title: book.volumeInfo.title,
            book_data: book,
          }),
        });

        if (response.ok) {
          setFavorites((prev) => {
            const newFavorites = new Set(prev);
            newFavorites.add(bookId);
            return newFavorites;
          });
          console.log("Added to favorites:", book.volumeInfo.title);
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
    }
  };

  const handleToggleToShelf = async (book) => {
    if (!user) {
      alert("Please sign in to add to shelf");
      return;
    }

    const bookId = book.id;
    const isOnShelf = shelfItems.has(bookId);

    try {
      if (isOnShelf) {
        // Remove from shelf
        const response = await fetch("http://localhost:3000/api/shelf", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supabase_id: user.id,
            book_id: bookId,
          }),
        });

        if (response.ok) {
          setShelfItems((prev) => {
            const newShelfItems = new Set(prev);
            newShelfItems.delete(bookId);
            return newShelfItems;
          });
          console.log("Removed from shelf:", book.volumeInfo.title);
        }
      } else {
        // Add to shelf
        const response = await fetch("http://localhost:3000/api/shelf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supabase_id: user.id,
            book_id: bookId,
            book_title: book.volumeInfo.title,
            book_data: book,
          }),
        });

        if (response.ok) {
          setShelfItems((prev) => {
            const newShelfItems = new Set(prev);
            newShelfItems.add(bookId);
            return newShelfItems;
          });
          console.log("Added to shelf:", book.volumeInfo.title);
        }
      }
    } catch (error) {
      console.error("Error toggling shelf:", error);
    }
  };

  if (books.length === 0) return <p>No books to show</p>;

  return (
    <div className="book-list">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          isFavorite={favorites.has(book.id)}
          toShelf={shelfItems.has(book.id)}
          onToggleFavorite={handleToggleFavorite}
          onToggleToShelf={handleToggleToShelf}
        />
      ))}
    </div>
  );
}

export default BookList;
