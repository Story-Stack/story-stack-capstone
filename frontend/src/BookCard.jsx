import './Book.css'
import BookModal from './BookModal.jsx'
import { useState } from 'react';


function BookCard(book) {

    const { title, authors, imageLinks } = book.volumeInfo;
    const [showModal, setShowModal] = useState(false);
    return (
    <div>

        <div className='book-card' onClick={() => setShowModal(true)}>

         {imageLinks?.thumbnail} &&(
            <img src={imageLinks.thumbnail}
            alt={title}
            />
         )
            <h4>{title}</h4>
            <p>{authors.join('. ') || 'Unknown author'}</p>
        </div>

        {showModal && <BookModal book={book} onClose={() => setShowModal(false)} />}
    </div>
    )
}

export default BookCard;
