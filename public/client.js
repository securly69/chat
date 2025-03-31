const socket = io();

// When the user clicks join, emit their info to the server
document.getElementById('joinBtn').addEventListener('click', () => {
  const username = document.getElementById('username').value;
  const profilePic = document.getElementById('profilePic').value;
  const color = document.getElementById('color').value;
  const role = document.getElementById('role').value;
  const server = document.getElementById('server').value || 'global';

  const userData = { username, profilePic, color, role, server };
  socket.emit('join', userData);

  document.getElementById('loginDiv').classList.add('hidden');
  document.getElementById('chatDiv').classList.remove('hidden');
});

// Sending a chat message
document.getElementById('sendBtn').addEventListener('click', () => {
  const message = document.getElementById('messageInput').value;
  if (!message.trim()) return;
  socket.emit('chatMessage', { message });
  document.getElementById('messageInput').value = '';
});

// Receiving a chat message
socket.on('chatMessage', (data) => {
  const msgDiv = document.getElementById('messages');
  const { from, message } = data;
  const messageElement = document.createElement('div');
  messageElement.classList.add('mb-2', 'p-2', 'rounded', 'shadow');
  // Use inline style for user color
  messageElement.style.borderLeft = `4px solid ${from.color}`;
  messageElement.innerHTML = `
    <img src="${from.profilePic}" alt="avatar" class="w-6 h-6 inline rounded-full mr-2">
    <span class="font-bold">${from.username}</span>: ${message}
  `;
  msgDiv.appendChild(messageElement);
  msgDiv.scrollTop = msgDiv.scrollHeight;
});

// Receiving a direct message (example)
socket.on('directMessage', (data) => {
  const msgDiv = document.getElementById('messages');
  const messageElement = document.createElement('div');
  messageElement.classList.add('mb-2', 'p-2', 'rounded', 'bg-blue-100');
  messageElement.innerHTML = `<span class="italic">[DM]</span> ${data.message}`;
  msgDiv.appendChild(messageElement);
  msgDiv.scrollTop = msgDiv.scrollHeight;
});
