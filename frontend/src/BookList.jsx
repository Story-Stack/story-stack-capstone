import "./BookList.css";
import BookCard from "./BookCard";
import { useState, useEffect } from "react";

function BookList({ books }) {
  const [favorites, setFavorites] = useState(new Set());
  const [shelfItems, setShelfItems] = useState(new Set());

  // Load saved data from localStorage on component mount
  useEffect(() => {
    const savedFavorites = localStorage.getItem("storystack-favorites");
    const savedShelfItems = localStorage.getItem("storystack-shelf");

    if (savedFavorites) {
      setFavorites(new Set(JSON.parse(savedFavorites)));
    }

    if (savedShelfItems) {
      setShelfItems(new Set(JSON.parse(savedShelfItems)));
    }
  }, []);

  // Save to localStorage whenever favorites change
  useEffect(() => {
    localStorage.setItem(
      "storystack-favorites",
      JSON.stringify([...favorites])
    );
  }, [favorites]);

  // Save to localStorage whenever shelf items change
  useEffect(() => {
    localStorage.setItem("storystack-shelf", JSON.stringify([...shelfItems]));
  }, [shelfItems]);

  const handleToggleFavorite = (book) => {
    const bookId = book.id;
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(bookId)) {
        newFavorites.delete(bookId);
        console.log("Removed from favorites:", book.volumeInfo.title);
      } else {
        newFavorites.add(bookId);
        console.log("Added to favorites:", book.volumeInfo.title);
      }
      return newFavorites;
    });
  };

  const handleToggleToShelf = (book) => {
    const bookId = book.id;
    setShelfItems((prev) => {
      const newShelfItems = new Set(prev);
      if (newShelfItems.has(bookId)) {
        newShelfItems.delete(bookId);
        console.log("Removed from shelf:", book.volumeInfo.title);
      } else {
        newShelfItems.add(bookId);
        console.log("Added to shelf:", book.volumeInfo.title);
      }
      return newShelfItems;
    });
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
