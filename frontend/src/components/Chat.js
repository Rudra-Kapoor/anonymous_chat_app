import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { FiSend, FiSmile, FiSkipForward } from 'react-icons/fi';
import './Chat.css';

const Chat = () => {
  const { socket, partnerId } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    socket.on('receive-message', (data) => {
      setMessages(prev => [...prev, {
        text: data.text,
        sender: 'partner',
        timestamp: data.timestamp
      }]);
    });

    socket.on('partner-typing', () => {
      setPartnerTyping(true);
    });

    socket.on('partner-stop-typing', () => {
      setPartnerTyping(false);
    });

    return () => {
      socket.off('receive-message');
      socket.off('partner-typing');
      socket.off('partner-stop-typing');
    };
  }, [socket]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    const messageData = {
      text: newMessage,
      timestamp: new Date()
    };

    socket.emit('send-message', { text: newMessage });
    
    setMessages(prev => [...prev, {
      ...messageData,
      sender: 'me'
    }]);
    
    setNewMessage('');
    stopTyping();
  };

  const handleTyping = () => {
    if (!socket) return;

    if (!isTyping) {
      socket.emit('typing');
      setIsTyping(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing');
      setIsTyping(false);
    }, 1000);
  };

  const stopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTyping && socket) {
      socket.emit('stop-typing');
      setIsTyping(false);
    }
  };

  const handleDisconnect = () => {
    if (socket) {
      socket.emit('disconnect-partner');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="partner-info">
          <div className="partner-status">
            <span className="status-indicator"></span>
            <span>Stranger</span>
          </div>
          <div className="partner-id">ID: {partnerId?.substring(0, 8)}...</div>
        </div>
        <button onClick={handleDisconnect} className="disconnect-btn">
          <FiSkipForward /> Next Stranger
        </button>
      </div>

      <div className="chat-messages">
        <div className="welcome-message">
          <p>You are now chatting with a random stranger. Say hi!</p>
          <p className="warning-text">
            ⚠️ Warning: Please be careful about sharing personal information.
          </p>
        </div>

        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.sender === 'me' ? 'my-message' : 'partner-message'}`}
          >
            <div className="message-content">
              {message.text}
            </div>
            <div className="message-time">
              {new Date(message.timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
          </div>
        ))}

        {partnerTyping && (
          <div className="typing-indicator">
            <span>Stranger is typing</span>
            <div className="typing-dots">
              <div className="dot"></div>
              <div className="dot"></div>
              <div className="dot"></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="message-input"
          />
          <button type="button" className="emoji-btn">
            <FiSmile />
          </button>
        </div>
        <button type="submit" className="send-btn">
          <FiSend />
        </button>
      </form>

      <div className="chat-footer">
        <p>Press Enter to send • Click "Next Stranger" to disconnect</p>
      </div>
    </div>
  );
};

export default Chat;