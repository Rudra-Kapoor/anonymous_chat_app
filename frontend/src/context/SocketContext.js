import React, { createContext, useContext, useState, useEffect } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [partnerId, setPartnerId] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    
    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('partner-found', (data) => {
      setPartnerId(data.partnerId);
      setIsSearching(false);
    });

    newSocket.on('partner-disconnected', () => {
      setPartnerId(null);
      alert('Partner disconnected');
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  const value = {
    socket,
    isConnected,
    partnerId,
    setPartnerId,
    isSearching,
    setIsSearching
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};