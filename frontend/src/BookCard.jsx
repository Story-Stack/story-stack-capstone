import "./BookCard.css";
import BookModal from "./BookModal.jsx";
import { useState } from "react";
import placeholder from "./assets/placeholder.jpg";

function BookCard({ book }) {
  const { title, authors, imageLinks } = book.volumeInfo;
  const [showModal, setShowModal] = useState(false);
  return (
    <div>
      <div className="book-card" onClick={() => setShowModal(true)}>
        <img src={imageLinks?.thumbnail || placeholder} alt={title} />

        <p className="title">{title}</p>

        <p className="author">{(authors || ["Unknown author"]).join(", ")}</p>
      </div>

      {showModal && (
        <BookModal book={book} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default BookCard;
