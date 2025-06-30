import './BookModal.css'

function BookModal({book, onClose}) {
    const {
        title,
        author,
        imageLinks,
        description,
        previewLink,
        publisher,
        publishedDate,
    } = book.volumeInfo;



    return (
        <div>
            <button
          onClick={onClose}
          style={{ position: 'absolute', top: '1rem', right: '1rem', fontSize: '1.2rem' }}
        >
          ✖
        </button>

        {imageLinks?.thumbnail && (
          <img src={imageLinks.thumbnail} alt={title} style={{ width: '120px', float: 'right' }} />
        )}

        <h2>{title}</h2>
        <p><strong>Author(s):</strong> {authors?.join(', ') || 'Unknown'}</p>
        <p><strong>Publisher:</strong> {publisher || 'N/A'}</p>
        <p><strong>Published:</strong> {publishedDate || 'N/A'}</p>
        <p style={{ marginTop: '1rem' }}>{description || 'No description available.'}</p>
        {previewLink && (
          <a href={previewLink} target="_blank" rel="noopener noreferrer" style={{ marginTop: '1rem', display: 'inline-block' }}>
            📖 Preview on Google Books
          </a>
        )}

        </div>
    )


}

export default BookModal;
