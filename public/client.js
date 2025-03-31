const socket = io();

// For demo purposes, list of available servers (tabs)
const availableServers = ["Global", "Gaming", "Music", "Tech"];

// References to pages
const loginPage = document.getElementById('loginPage');
const appPage = document.getElementById('app');

// When user clicks join on login page
document.getElementById('joinBtn').addEventListener('click', () => {
  const username = document.getElementById('username').value.trim();
  const profilePic = document.getElementById('profilePic').value.trim();
  const server = document.getElementById('serverInput').value.trim() || "Global";
  
  if (!username) return alert("Username required");

  // Emit join event with user data (role will be set server-side)
  socket.emit('join', { username, profilePic, server });

  // Hide login page, show main app layout
  loginPage.classList.add('hidden');
  appPage.classList.remove('hidden');

  // Initialize server tabs UI
  renderServerTabs();
});

// Render the server tabs sidebar
function renderServerTabs() {
  const serverTabs = document.getElementById('serverTabs');
  serverTabs.innerHTML = "";
  availableServers.forEach(srv => {
    const tab = document.createElement('div');
    tab.className = 'server-tab';
    tab.title = srv;
    tab.innerHTML = `<span class="text-white text-sm">${srv.charAt(0)}</span>`;
    tab.addEventListener('click', () => {
      // Emit a switchServer event to join this room
      socket.emit('switchServer', srv);
      // Highlight active tab
      document.querySelectorAll('.server-tab').forEach(el => el.classList.remove('active'));
      tab.classList.add('active');
    });
    // If this tab is the current server, mark as active
    if (srv === document.getElementById('serverInput').value.trim() || srv === "Global") {
      tab.classList.add('active');
    }
    serverTabs.appendChild(tab);
  });
}

// Handle sending public chat messages
document.getElementById('sendBtn').addEventListener('click', () => {
  const message = document.getElementById('messageInput').value.trim();
  if (!message) return;
  socket.emit('chatMessage', { message });
  document.getElementById('messageInput').value = '';
});

// Toggle DM input
document.getElementById('dmBtn').addEventListener('click', () => {
  const dmRecipient = document.getElementById('dmRecipient');
  dmRecipient.classList.toggle('hidden');
});

// Handle sending DM messages
// When DM input loses focus or Enter is pressed, send DM if recipient provided
document.getElementById('dmRecipient').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendDM();
  }
});
function sendDM() {
  const recipient = document.getElementById('dmRecipient').value.trim();
  const message = document.getElementById('messageInput').value.trim();
  if (!recipient || !message) return alert("DM recipient and message required.");
  socket.emit('privateMessage', { toUsername: recipient, message });
  document.getElementById('messageInput').value = '';
}

// Display incoming public messages
socket.on('chatMessage', (data) => {
  displayMessage(data.from, data.message);
});

// Display incoming system messages
socket.on('systemMessage', (data) => {
  displayMessage({ username: "System", profilePic: "", color: "#7289DA" }, data.message);
});

// Display incoming DM messages
socket.on('privateMessage', (data) => {
  displayMessage(data.from, `[DM] ${data.message}`, true);
});

// Function to display messages
function displayMessage(user, message, isDM = false) {
  const messagesDiv = document.getElementById('messages');
  const messageEl = document.createElement('div');
  messageEl.className = `mb-2 p-2 rounded ${isDM ? 'bg-purple-800' : 'bg-gray-800'}`;
  messageEl.innerHTML = `
    <img src="${user.profilePic}" alt="pfp" class="inline w-6 h-6 rounded-full mr-2">
    <span style="color: ${user.color}; font-weight: bold;">${user.username}</span>: ${message}
  `;
  messagesDiv.appendChild(messageEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}
