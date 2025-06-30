import './BookList.css';
import Book from './BookCard';

function BookList({books}) {
  if (books.length === 0) return <p>No books to show</p>
  return (
    <div className='book-list'>
      {books.map(book =>
      <BookCard
      key={book.id}
      book={book}
      />)}
    </div>
  )
}

export default BookList;
