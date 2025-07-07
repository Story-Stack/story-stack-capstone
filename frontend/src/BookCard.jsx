import "./BookCard.css";
import BookModal from "./BookModal.jsx";
import { useState } from "react";
import placeholder from "./assets/placeholder.jpg";

function BookCard({
  book,
  isFavorite = false,
  toShelf = false,
  onToggleFavorite,
  onToggleToShelf,
}) {
  const { title, authors } = book.volumeInfo;
  const [showModal, setShowModal] = useState(false);

  const toggleFavorite = (e) => {
    e.stopPropagation(); // Prevent opening the modal
    if (onToggleFavorite) {
      onToggleFavorite(book);
    }
  };

  const toggleToShelf = (e) => {
    e.stopPropagation(); // Prevent opening the modal
    if (onToggleToShelf) {
      onToggleToShelf(book);
    }
  };

  const image =
    book.volumeInfo.imageLinks?.extraLarge ||
    book.volumeInfo.imageLinks?.large ||
    book.volumeInfo.imageLinks?.medium ||
    book.volumeInfo.imageLinks?.thumbnail ||
    book.volumeInfo.imageLinks?.smallThumbnail ||
    placeholder;

  return (
    <div>
      <div className="book-card" onClick={() => setShowModal(true)}>
        <img src={image} alt={title} />

        <p className="title">{title}</p>

        <p className="author">{(authors || ["Unknown author"]).join(", ")}</p>

        <div className="card-actions">
          <button
            className={`favorite-btn ${isFavorite ? "active" : ""}`}
            onClick={toggleFavorite}
            aria-label={
              isFavorite ? "Remove from favorites" : "Add to favorites"
            }
          >
            {isFavorite ? "❤️" : "♡"}
          </button>

          <button
            className={`watched-btn ${toShelf ? "active" : ""}`}
            onClick={toggleToShelf}
            aria-label={toShelf ? "Add to Shelf" : "Remove from Shelf"}
          >
            {toShelf ? "✔️" : "➕"}
          </button>
        </div>
      </div>

      {showModal && (
        <BookModal book={book} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default BookCard;
