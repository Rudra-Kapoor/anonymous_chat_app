import React, { useState } from 'react';
import { useSocket } from '../context/SocketContext';
import Chat from './Chat';
import './Home.css';

const Home = () => {
  const { socket, isConnected, partnerId, isSearching, setIsSearching } = useSocket();
  const [interests, setInterests] = useState('');
  const [preferences, setPreferences] = useState({
    language: 'English',
    gender: 'prefer-not-to-say'
  });

  const handleStartChat = () => {
    if (!socket || !isConnected) {
      alert('Not connected to server');
      return;
    }

    const interestsArray = interests.split(',').map(i => i.trim()).filter(i => i);
    
    // Set preferences
    socket.emit('set-preferences', {
      interests: interestsArray,
      language: preferences.language,
      gender: preferences.gender
    });

    // Start searching
    socket.emit('start-search', {
      interests: interestsArray
    });
    
    setIsSearching(true);
  };

  const handleStopSearch = () => {
    if (socket) {
      socket.emit('stop-search');
      setIsSearching(false);
    }
  };

  const handleDisconnect = () => {
    if (socket) {
      socket.emit('disconnect-partner');
    }
  };

  if (partnerId) {
    return <Chat />;
  }

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Omegle Clone</h1>
        <div className="connection-status">
          Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </div>
      </div>

      <div className="home-content">
        <div className="welcome-section">
          <h2>Talk to Strangers!</h2>
          <p>Click below to start a random chat with someone from around the world.</p>
        </div>

        <div className="preferences-section">
          <h3>Preferences (Optional)</h3>
          
          <div className="form-group">
            <label>Interests (comma separated):</label>
            <input
              type="text"
              placeholder="e.g., music, movies, sports"
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              className="interests-input"
            />
          </div>

          <div className="form-group">
            <label>Language:</label>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences({...preferences, language: e.target.value})}
              className="language-select"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Chinese">Chinese</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>

          <div className="form-group">
            <label>Gender:</label>
            <select
              value={preferences.gender}
              onChange={(e) => setPreferences({...preferences, gender: e.target.value})}
              className="gender-select"
            >
              <option value="prefer-not-to-say">Prefer not to say</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="action-section">
          {isSearching ? (
            <div className="searching-container">
              <div className="searching-animation">
                <div className="dot-flashing"></div>
                <span>Looking for someone to chat with...</span>
              </div>
              <button onClick={handleStopSearch} className="stop-btn">
                Stop
              </button>
            </div>
          ) : (
            <button onClick={handleStartChat} className="start-btn" disabled={!isConnected}>
              {isConnected ? 'Start Chatting!' : 'Connecting...'}
            </button>
          )}
        </div>

        <div className="info-section">
          <h3>Rules & Safety</h3>
          <ul>
            <li>🔞 You must be 18+ to use this service</li>
            <li>🚫 No nudity or sexual content</li>
            <li>🚫 No harassment or bullying</li>
            <li>🚫 No spam or advertising</li>
            <li>⚠️ Be careful sharing personal information</li>
            <li>🔄 You can disconnect anytime by clicking "Stop"</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Home;