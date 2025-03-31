const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

// Serve static files from the public folder
app.use(express.static('public'));

let users = {};

io.on('connection', (socket) => {
  console.log('New connection: ' + socket.id);
  
  // When a user joins, store their details and join a “server” room (default 'global')
  socket.on('join', (userData) => {
    users[socket.id] = userData;
    const room = userData.server || 'global';
    socket.join(room);
    // Optionally, notify others in the room
    io.to(room).emit('chatMessage', {
      from: { username: "System", color: "#fbbf24", profilePic: "" },
      message: `${userData.username} has joined ${room}`
    });
  });

  // Broadcast a chat message to the same room
  socket.on('chatMessage', (data) => {
    const room = users[socket.id].server || 'global';
    io.to(room).emit('chatMessage', {
      from: users[socket.id],
      message: data.message
    });
  });

  // Direct messaging example (data: {message, to})
  socket.on('directMessage', (data) => {
    const targetSocket = data.to;
    // Send only to recipient and sender
    socket.to(targetSocket).emit('directMessage', {
      from: socket.id,
      message: data.message
    });
    socket.emit('directMessage', {
      from: socket.id,
      message: data.message
    });
  });

  // For channel joining (if you want to implement channels within a server)
  socket.on('joinChannel', (channelName) => {
    socket.join(channelName);
    socket.emit('joinedChannel', channelName);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected: ' + socket.id);
    delete users[socket.id];
    // Optionally notify others
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
