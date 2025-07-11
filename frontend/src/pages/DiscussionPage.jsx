
import { useEffect, useState, useRef } from 'react';
import './DiscussionPage.css';
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from '../App';

export default function DiscussionPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [bookData, setBookData] = useState(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { bookId } = useParams();
  const { user } = useAuth();
  const channelId = bookId; // Use bookId from URL params as channelId


  // Fetch book data from our database (channel data) or Google Books API as fallback
  useEffect(() => {
    const fetchBookData = async () => {
      if (!bookId) return;

      try {
        console.log('Fetching channel data for bookId:', bookId);
        const response = await fetch(`http://localhost:3000/api/channels/book/${bookId}`);

        if (response.ok) {
          const channelData = await response.json();
          console.log('Channel data received:', channelData);

          // Use the stored book_data from the channel
          if (channelData.book_data) {
            console.log('Book data found:', channelData.book_data);
            setBookData(channelData.book_data);
            return;
          }
        }

        // Fallback: Channel doesn't exist or no book_data, fetch from Google Books API
        console.log('Channel not found, fetching from Google Books API as fallback');
        const apiKey = import.meta.env.VITE_GOOGLE_BOOKS_API_KEY;
        const googleBooksResponse = await fetch(
          `https://www.googleapis.com/books/v1/volumes/${bookId}?key=${apiKey}`
        );

        if (googleBooksResponse.ok) {
          const bookData = await googleBooksResponse.json();
          console.log('Book data fetched from Google Books:', bookData);
          setBookData(bookData);
        } else {
          console.log('Failed to fetch book data from Google Books');
        }
      } catch (error) {
        console.error('Error fetching book data:', error);
      }
    };

    fetchBookData();
  }, [bookId]);

  // 🔄 Fetch messages from database using actual channel ID
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        // First get the actual channel ID
        const channelResponse = await fetch(`http://localhost:3000/api/channels/book/${bookId}`);
        if (channelResponse.ok) {
          const channelData = await channelResponse.json();
          const actualChannelId = channelData.id;

          // Now fetch messages using the actual channel ID
          const messagesResponse = await fetch(`http://localhost:3000/api/messages/channel/${actualChannelId}`);
          if (messagesResponse.ok) {
            const data = await messagesResponse.json();
            setMessages(data);
          }
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    if (bookId) {
      fetchMessages();
    }
  }, [bookId]);

  // Send message
  const sendMessage = async () => {
    if (newMessage.trim() === '' || !user) return;

    try {
      console.log('Sending message:', { content: newMessage, bookId, userId: user.id });

      // First, ensure the channel exists and get the actual channel ID
      const actualChannelId = await ensureChannelExists();

      if (!actualChannelId) {
        console.error('Could not get or create channel');
        return;
      }

      const response = await fetch('http://localhost:3000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          channelId: actualChannelId, // Use the actual channel UUID
          userId: user.id
        }),
      });

      if (response.ok) {
        const newMsg = await response.json();
        console.log('Message sent successfully:', newMsg);
        setMessages((prev) => [...prev, newMsg]);
        setNewMessage('');
      } else {
        console.error('Failed to send message, status:', response.status);
        const errorData = await response.text();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Ensure channel exists before sending messages and return the channel ID
  const ensureChannelExists = async () => {
    try {
      // Check if channel exists
      const checkResponse = await fetch(`http://localhost:3000/api/channels/book/${bookId}`);

      if (checkResponse.ok) {
        const channelData = await checkResponse.json();
        console.log('Channel exists, using channel ID:', channelData.id);
        return channelData.id; // Return the actual channel UUID
      }

      // Channel doesn't exist, create it
      console.log('Channel does not exist, creating it...');

      if (bookData) {
        const createResponse = await fetch('http://localhost:3000/api/user-channels/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            bookId: bookId,
            bookTitle: bookData.volumeInfo?.title || 'Unknown Title',
            bookData: bookData
          }),
        });

        if (createResponse.ok) {
          console.log('Channel created successfully');
          // Fetch the channel again to get the ID
          const newCheckResponse = await fetch(`http://localhost:3000/api/channels/book/${bookId}`);
          if (newCheckResponse.ok) {
            const newChannelData = await newCheckResponse.json();
            console.log('New channel ID:', newChannelData.id);
            return newChannelData.id;
          }
        } else {
          console.error('Failed to create channel');
        }
      }

      return null;
    } catch (error) {
      console.error('Error ensuring channel exists:', error);
      return null;
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="previous-btn" onClick={() => navigate("/dashboard")}>
          ❮
        </button>
        <div className="header-content">
          <h1 className="chat-title">Discussion</h1>
          {bookData && (
            <h2 className="book-info">
              {bookData.volumeInfo?.title} - {bookData.volumeInfo?.authors?.join(', ') || 'Unknown Author'}
            </h2>
          )}
        </div>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => {
          const isCurrentUser = msg.supabase_id === user?.id;
          return (
            <div
              key={index}
              className={`message-wrapper ${isCurrentUser ? 'sent' : 'received'}`}
            >
              <div className={`message-bubble ${isCurrentUser ? 'sent-bubble' : 'received-bubble'}`}>
                {!isCurrentUser && (
                  <div className="sender-name">{msg.sender}</div>
                )}
                
                <div className="message-content">{msg.content}</div>
                <div className="message-time">
                  {new Date(msg.created_at || msg.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        <input
          className="message-input"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
        />
        <button
          onClick={sendMessage}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
}
