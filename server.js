const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const PORT = process.env.PORT || 3000;

// Hardcoded admin list (only these usernames will be set as "admin")
const adminList = ["Alice", "Bob"];

let users = {}; // store user data by socket.id

// Serve static files from /public
app.use(express.static('public'));

// Helper: Switch room for a socket
function switchRoom(socket, newRoom) {
  // Remove from all rooms except socket.id
  for (let room of socket.rooms) {
    if (room !== socket.id) {
      socket.leave(room);
    }
  }
  socket.join(newRoom);
}

io.on('connection', (socket) => {
  console.log('New connection: ' + socket.id);

  // Handle join event from login form
  socket.on('join', (userData) => {
    // Force role if username is in adminList
    if (adminList.includes(userData.username)) {
      userData.role = "admin";
    } else {
      userData.role = "regular";
    }
    // If no pfp provided, assign a default system pfp
    if (!userData.profilePic) {
      userData.profilePic = "https://via.placeholder.com/40?text=PF";
    }
    // Set default server if not provided
    const server = userData.server || "Global";
    userData.server = server;
    users[socket.id] = userData;
    socket.join(server);
    // Notify room that a new user has joined
    io.to(server).emit('systemMessage', {
      message: `${userData.username} has joined ${server}`
    });
  });

  // Handle server switch from sidebar
  socket.on('switchServer', (newServer) => {
    if (users[socket.id]) {
      const oldServer = users[socket.id].server;
      switchRoom(socket, newServer);
      users[socket.id].server = newServer;
      // Notify both rooms (optional)
      io.to(oldServer).emit('systemMessage', {
        message: `${users[socket.id].username} has left ${oldServer}`
      });
      io.to(newServer).emit('systemMessage', {
        message: `${users[socket.id].username} has joined ${newServer}`
      });
    }
  });

  // Handle public chat messages
  socket.on('chatMessage', (data) => {
    if (users[socket.id]) {
      const server = users[socket.id].server || "Global";
      io.to(server).emit('chatMessage', {
        from: users[socket.id],
        message: data.message
      });
    }
  });

  // Handle private messaging: data {toUsername, message}
  socket.on('privateMessage', (data) => {
    // Look up target socket by username
    const targetSocketId = Object.keys(users).find(
      id => users[id].username === data.toUsername
    );
    if (targetSocketId && users[socket.id]) {
      // Send DM to both sender and receiver
      io.to(targetSocketId).emit('privateMessage', {
        from: users[socket.id],
        message: data.message
      });
      socket.emit('privateMessage', {
        from: users[socket.id],
        message: data.message
      });
    }
  });

  // When a user disconnects
  socket.on('disconnect', () => {
    if (users[socket.id]) {
      const server = users[socket.id].server;
      io.to(server).emit('systemMessage', {
        message: `${users[socket.id].username} has disconnected.`
      });
      delete users[socket.id];
    }
  });
});

http.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
