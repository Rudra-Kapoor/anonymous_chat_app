import React from 'react';
import { SocketProvider } from './context/SocketContext';
import Home from './components/Home';
import './App.css';

function App() {
  return (
    <SocketProvider>
      <div className="App">
        <Home />
      </div>
    </SocketProvider>
  );
}

export default App;