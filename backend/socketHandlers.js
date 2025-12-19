const User = require('./models/User');
const Chat = require('./models/Chat');

const waitingUsers = new Map(); // Map of socketId -> user interests
const activePairs = new Map(); // Map of socketId -> partnerSocketId

const initializeSocket = (io) => {
  io.on('connection', async (socket) => {
    console.log('User connected:', socket.id);

    // Create user in database
    try {
      const user = new User({
        socketId: socket.id,
        isAvailable: true
      });
      await user.save();
    } catch (error) {
      console.error('Error creating user:', error);
    }

    // User sets preferences
    socket.on('set-preferences', async (data) => {
      try {
        await User.findOneAndUpdate(
          { socketId: socket.id },
          {
            interests: data.interests || [],
            language: data.language || 'English',
            gender: data.gender || 'prefer-not-to-say',
            country: data.country || 'Unknown'
          }
        );
      } catch (error) {
        console.error('Error updating preferences:', error);
      }
    });

    // Start searching for a partner
    socket.on('start-search', async (data) => {
      try {
        await User.findOneAndUpdate(
          { socketId: socket.id },
          { isSearching: true, isAvailable: true }
        );

        // Add to waiting users
        waitingUsers.set(socket.id, data.interests || []);

        // Try to find a match
        findMatch(socket.id, data.interests || []);
      } catch (error) {
        console.error('Error starting search:', error);
      }
    });

    // Stop searching
    socket.on('stop-search', async () => {
      try {
        await User.findOneAndUpdate(
          { socketId: socket.id },
          { isSearching: false, isAvailable: true, currentPartner: null }
        );
        
        waitingUsers.delete(socket.id);
        
        // If in active pair, disconnect partner
        if (activePairs.has(socket.id)) {
          const partnerId = activePairs.get(socket.id);
          activePairs.delete(partnerId);
          activePairs.delete(socket.id);
          
          io.to(partnerId).emit('partner-disconnected');
          await User.findOneAndUpdate(
            { socketId: partnerId },
            { isSearching: false, isAvailable: true, currentPartner: null }
          );
        }
        
        socket.emit('search-stopped');
      } catch (error) {
        console.error('Error stopping search:', error);
      }
    });

    // Send message
    socket.on('send-message', async (data) => {
      const partnerId = activePairs.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit('receive-message', {
          sender: socket.id,
          text: data.text,
          timestamp: new Date()
        });

        // Save message to database
        try {
          const chat = await Chat.findOne({
            $or: [
              { user1: socket.id, user2: partnerId, isActive: true },
              { user1: partnerId, user2: socket.id, isActive: true }
            ]
          });

          if (chat) {
            chat.messages.push({
              sender: socket.id,
              text: data.text
            });
            await chat.save();
          }
        } catch (error) {
          console.error('Error saving message:', error);
        }
      }
    });

    // Typing indicator
    socket.on('typing', () => {
      const partnerId = activePairs.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit('partner-typing');
      }
    });

    // Stop typing indicator
    socket.on('stop-typing', () => {
      const partnerId = activePairs.get(socket.id);
      if (partnerId) {
        io.to(partnerId).emit('partner-stop-typing');
      }
    });

    // Disconnect partner
    socket.on('disconnect-partner', async () => {
      const partnerId = activePairs.get(socket.id);
      if (partnerId) {
        activePairs.delete(partnerId);
        activePairs.delete(socket.id);
        
        io.to(partnerId).emit('partner-disconnected');
        
        // Update users in database
        await Promise.all([
          User.findOneAndUpdate(
            { socketId: socket.id },
            { isSearching: false, isAvailable: true, currentPartner: null }
          ),
          User.findOneAndUpdate(
            { socketId: partnerId },
            { isSearching: false, isAvailable: true, currentPartner: null }
          )
        ]);

        // Update chat in database
        await Chat.findOneAndUpdate(
          {   
            $or: [
              { user1: socket.id, user2: partnerId, isActive: true },
              { user1: partnerId, user2: socket.id, isActive: true }
            ]
          },
          { isActive: false, endedAt: new Date() }
        );
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log('User disconnected:', socket.id);
      
      waitingUsers.delete(socket.id);
      
      const partnerId = activePairs.get(socket.id);
      if (partnerId) {
        activePairs.delete(partnerId);
        io.to(partnerId).emit('partner-disconnected');
        
        await User.findOneAndUpdate(
          { socketId: partnerId },
          { isSearching: false, isAvailable: true, currentPartner: null }
        );
      }
      
      activePairs.delete(socket.id);
      
      try {
        await User.findOneAndDelete({ socketId: socket.id });
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    });

    // Function to find a match
    const findMatch = async (socketId, interests) => {
      for (const [waitingId, waitingInterests] of waitingUsers.entries()) {
        if (waitingId !== socketId && !activePairs.has(waitingId)) {
          // Check for interest match (simple implementation)
          const hasCommonInterests = interests.some(interest => 
            waitingInterests.includes(interest)
          ) || interests.length === 0 || waitingInterests.length === 0;
          
          if (hasCommonInterests) {
            // Create a pair
            activePairs.set(socketId, waitingId);
            activePairs.set(waitingId, socketId);
            
            waitingUsers.delete(socketId);
            waitingUsers.delete(waitingId);
            
            // Create chat in database
            const chat = new Chat({
              user1: socketId,
              user2: waitingId,
              isActive: true
            });
            await chat.save();
            
            // Update users in database
            await Promise.all([
              User.findOneAndUpdate(
                { socketId: socketId },
                { isSearching: false, isAvailable: false, currentPartner: waitingId }
              ),
              User.findOneAndUpdate(
                { socketId: waitingId },
                { isSearching: false, isAvailable: false, currentPartner: socketId }
              )
            ]);
            
            // Notify both users
            io.to(socketId).emit('partner-found', { partnerId: waitingId });
            io.to(waitingId).emit('partner-found', { partnerId: socketId });
            
            break;
          }
        }
      }
    };
  });
};

module.exports = initializeSocket;