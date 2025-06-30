import "./BookCard.css";
import BookModal from "./BookModal.jsx";
import { useState } from "react";
import placeholder from "./assets/placeholder.jpg";

function BookCard({ book }) {
  const { title, authors, imageLinks } = book.volumeInfo;
  const [showModal, setShowModal] = useState(false);

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
      </div>

      {showModal && (
        <BookModal book={book} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}

export default BookCard;
