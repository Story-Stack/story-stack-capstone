
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import io from 'socket.io-client';
import './DiscussionPage.css';
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from '../App';


const supabase = createClient(
  'https://your-project.supabase.co',
  'public-anon-key' // use env vars in production
);

const socket = io('http://localhost:3001'); // Replace with deployed backend URL

export default function DiscussionPage() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { bookId } = useParams();
  const { user } = useAuth();
  const channelId = bookId; // Use bookId from URL params as channelId


  // 🔄 Fetch messages from Supabase on load
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true });

      if (error) console.error('Error fetching messages:', error.message);
      else setMessages(data);
    };

    fetchMessages();
  }, [channelId]);

  // 🔌 WebSocket connection
  useEffect(() => {
    socket.emit('join_channel', channelId);

    socket.on('receive_message', (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('receive_message');
      // Don't leave the channel when component unmounts to maintain connection
    };
  }, [channelId]);


  // Send message
  const sendMessage = () => {
    if (newMessage.trim() === '') return;

    const msg = {
      content: newMessage,
      sender: user?.name || 'Anonymous',
      timestamp: new Date().toISOString(),
    };

    socket.emit('send_message', { channelId, message: msg });
    setMessages((prev) => [...prev, msg]); // optimistic update
    setNewMessage('');
  };

  // 🔽 Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button className="previous-btn" onClick={() => navigate("/dashboard")}>
          ❮
        </button>
        <h1 className="chat-title">Discussion</h1>
      </div>

      <div className="messages-container">
        {messages.map((msg, index) => {
          const isCurrentUser = msg.sender === (user?.name || 'Anonymous');
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
