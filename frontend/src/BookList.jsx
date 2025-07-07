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
    if (!user) {
      console.log("No user found, skipping data load");
      return;
    }

    console.log("Loading user data for user:", user);
    console.log("User ID:", user.id);

    try {
      // Load favorites
      const favoritesUrl = `http://localhost:3000/api/favorites/${user.id}`;
      console.log("Fetching favorites from:", favoritesUrl);

      const favoritesResponse = await fetch(favoritesUrl);
      console.log("Favorites response status:", favoritesResponse.status);

      if (favoritesResponse.ok) {
        const favoritesData = await favoritesResponse.json();
        console.log("Favorites data:", favoritesData);
        const favoriteIds = new Set(favoritesData.map((fav) => fav.book_id));
        setFavorites(favoriteIds);
        console.log("Set favorites:", favoriteIds);
      } else {
        const errorData = await favoritesResponse.json();
        console.log("Favorites error:", errorData);
      }

      // Load shelf items
      const shelfUrl = `http://localhost:3000/api/shelf/${user.id}`;
      console.log("Fetching shelf items from:", shelfUrl);

      const shelfResponse = await fetch(shelfUrl);
      console.log("Shelf response status:", shelfResponse.status);

      if (shelfResponse.ok) {
        const shelfData = await shelfResponse.json();
        console.log("Shelf data:", shelfData);
        const shelfIds = new Set(shelfData.map((item) => item.book_id));
        setShelfItems(shelfIds);
        console.log("Set shelf items:", shelfIds);
      } else {
        const errorData = await shelfResponse.json();
        console.log("Shelf error:", errorData);
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleToggleFavorite = async (book) => {
    console.log("handleToggleFavorite called with book:", book);
    console.log("Current user:", user);

    if (!user) {
      alert("Please sign in to add favorites");
      return;
    }

    const bookId = book.id;
    const isFavorited = favorites.has(bookId);

    console.log("Book ID:", bookId);
    console.log("Is favorited:", isFavorited);
    console.log("Current favorites set:", favorites);

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
        } else {
          const errorData = await response.json();
          console.error("Failed to remove from favorites:", errorData);
          alert("Failed to remove from favorites. Please try again.");
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
        } else {
          const errorData = await response.json();
          console.error("Failed to add to favorites:", errorData);
          alert("Failed to add to favorites. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Network error. Please check your connection and try again.");
    }
  };

  const handleToggleToShelf = async (book) => {
    console.log("handleToggleToShelf called with book:", book);
    console.log("Current user:", user);

    if (!user) {
      alert("Please sign in to add to shelf");
      return;
    }

    const bookId = book.id;
    const isOnShelf = shelfItems.has(bookId);

    console.log("Book ID:", bookId);
    console.log("Is on shelf:", isOnShelf);
    console.log("Current shelf items set:", shelfItems);

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
        } else {
          const errorData = await response.json();
          console.error("Failed to remove from shelf:", errorData);
          alert("Failed to remove from shelf. Please try again.");
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
        } else {
          const errorData = await response.json();
          console.error("Failed to add to shelf:", errorData);
          alert("Failed to add to shelf. Please try again.");
        }
      }
    } catch (error) {
      console.error("Error toggling shelf:", error);
      alert("Network error. Please check your connection and try again.");
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
