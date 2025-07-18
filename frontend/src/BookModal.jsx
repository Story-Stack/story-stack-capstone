import { useState, useEffect } from "react";
import { supabase } from "../utils/supabaseClient";
import "./BookModal.css";

function BookModal({ book, onClose, onJoinDiscussion, isJoined }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    title,
    authors,
    imageLinks,
    description,
    previewLink,
    publisher,
    publishedDate,
    pageCount,
    averageRating,
    categories,
  } = book.volumeInfo;

  useEffect(() => {
    getCurrentUser();
    fetchComments();
  }, [book.id]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const response = await fetch(`http://localhost:3000/api/users/supabase/${user.id}`);
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          setUser({
            id: user.id,
            supabase_id: user.id,
            first_name: user.user_metadata?.first_name || "Anonymous",
            email: user.email
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUser({
          id: user.id,
          supabase_id: user.id,
          first_name: user.user_metadata?.first_name || "Anonymous",
          email: user.email
        });
      }
    }
  };

  const fetchComments = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/comments/book/${book.id}`);
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment,
          book_id: book.id,
          book_title: title,
          book_data: book,
          userId: user.id
        }),
      });

      if (response.ok) {
        const comment = await response.json();
        setComments(prev => [...prev, comment]);
        setNewComment("");
        setShowCommentForm(false);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return diffInMinutes < 1 ? "Just now" : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          ✖
        </button>

        {imageLinks?.thumbnail && (
          <img
            src={imageLinks.thumbnail}
            alt={title}
            className="book-cover"
          />
        )}

        <h2>{title}</h2>
        <p>
          <strong>Author(s):</strong> {authors?.join(", ") || "Unknown"}
        </p>
        <p>
          <strong>Publisher:</strong> {publisher || "N/A"}
        </p>
         <p>
          <strong>Page Count:</strong> {pageCount || "N/A"}
        </p>
         <p>
          <strong>Average Rating:</strong> {averageRating ? `${averageRating}/5` : "N/A"}
        </p>
        <p>
          <strong>Published:</strong> {publishedDate ? new Date(publishedDate).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }) : "N/A"}
        </p>

         <p>
          <strong>{categories.length > 1 ? "Categories:" : "Category:"}</strong>
            {categories.length > 0 ? ` ${categories.join(", ")}` : " N/A"}
        </p>
        <div className="overview">
          <p>
            {description || "No description available."}
          </p>
        </div>

        <div className="modal-actions">
          <button
            className={`join-discussion ${isJoined ? "leave-discussion" : ""}`}
            onClick={() => {
              if (onJoinDiscussion) {
                onJoinDiscussion(book);
              }
            }}
          >
            {isJoined ? "Leave Discussion" : "Join Discussion"}
          </button>

          <button
            className="comment-btn"
            onClick={() => setShowCommentForm(!showCommentForm)}
          >
            💬 {showCommentForm ? "Cancel" : "Add Comment"}
          </button>
        </div>

        {showCommentForm && (
          <div className="comment-form">
            <form onSubmit={handleAddComment}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Share your thoughts about this book..."
                className="comment-input"
                rows="3"
              />
              <div className="comment-form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => {
                    setShowCommentForm(false);
                    setNewComment("");
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="submit-comment-btn"
                  disabled={!newComment.trim() || loading}
                >
                  {loading ? "Posting..." : "Post Comment"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="comments-section">
          <h3>Comments ({comments.length})</h3>
          {comments.length === 0 ? (
            <p className="no-comments">No comments yet. Be the first to share your thoughts!</p>
          ) : (
            <div className="comments-list">
              {comments.map((comment) => (
                <div key={comment.id} className="comment">
                  <div className="comment-header">
                    <div className="comment-author">
                      <div className="author-avatar">
                        {comment.user?.first_name?.[0] || "A"}
                      </div>
                      <span className="author-name">
                        {comment.user?.first_name || "Anonymous"}
                      </span>
                    </div>
                    <span className="comment-time">
                      {formatTime(comment.createdAt)}
                    </span>
                  </div>
                  <div className="comment-content">
                    {comment.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {previewLink && (
          <div className="preview-link">
            <a
              href={previewLink}
              target="_blank"
              rel="noopener noreferrer"
            >
              📖 Preview on Google Books
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookModal;
