const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Track active users
const activeUsers = new Map();

// Helper to generate timestamps
function getTimestamp() {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // HH:MM:SS
}

// Preset channels
const CHANNELS = ['#dispatch', '#tactical-1', '#intel-ops'];

// Sockets setup below

io.on('connection', (socket) => {
  console.log(`[SERVER] Client connected: ${socket.id}`);

  // Default callsign until user registers
  let clientCallsign = `UNIT-${socket.id.substring(0, 4).toUpperCase()}`;
  let clientChannel = '#dispatch';

  socket.join(clientChannel);

  // Send init data to the new client
  socket.emit('init', {
    defaultCallsign: clientCallsign,
    channels: CHANNELS,
    activeChannel: clientChannel,
  });

  // Handle register/update callsign
  socket.on('register', (data) => {
    const oldCallsign = clientCallsign;
    clientCallsign = data.callsign.toUpperCase();
    activeUsers.set(socket.id, { callsign: clientCallsign, channel: clientChannel });
    console.log(`[SERVER] Socket ${socket.id} registered callsign: ${clientCallsign}`);

    // Broadcast updated user list
    broadcastUserList();

    // Broadcast system message
    io.to(clientChannel).emit('message', {
      id: `sys-${Date.now()}`,
      sender: 'SYSTEM',
      text: `${clientCallsign} has connected to ${clientChannel}.`,
      channel: clientChannel,
      timestamp: getTimestamp(),
      isSystem: true,
    });
  });

  // Handle joining a channel
  socket.on('join_channel', (channel) => {
    if (!CHANNELS.includes(channel)) return;

    const oldChannel = clientChannel;
    socket.leave(oldChannel);
    socket.join(channel);
    clientChannel = channel;

    if (activeUsers.has(socket.id)) {
      activeUsers.get(socket.id).channel = channel;
    }

    console.log(`[SERVER] Client ${clientCallsign} changed channel to ${channel}`);

    // Broadcast system message to old channel
    io.to(oldChannel).emit('message', {
      id: `sys-${Date.now()}`,
      sender: 'SYSTEM',
      text: `${clientCallsign} has left the channel.`,
      channel: oldChannel,
      timestamp: getTimestamp(),
      isSystem: true,
    });

    // Broadcast system message to new channel
    io.to(channel).emit('message', {
      id: `sys-${Date.now()}`,
      sender: 'SYSTEM',
      text: `${clientCallsign} joined ${channel}.`,
      channel: channel,
      timestamp: getTimestamp(),
      isSystem: true,
    });

    broadcastUserList();
  });

  // Handle chat messages
  socket.on('send_message', (msgData) => {
    const data = {
      id: msgData.id || `msg-${Date.now()}`,
      sender: clientCallsign,
      text: msgData.text,
      channel: clientChannel,
      timestamp: msgData.timestamp || getTimestamp(),
      isSystem: false,
    };

    console.log(`[SERVER] Message from ${clientCallsign} in ${clientChannel}: ${data.text}`);
    // Broadcast to everyone in the channel
    io.to(clientChannel).emit('message', data);
  });

  // Handle voice/audio transmissions
  socket.on('voice_transmit', (audioData) => {
    console.log(`[SERVER] Voice transmission from ${clientCallsign} in ${clientChannel}`);
    // Broadcast to everyone in the channel except the sender to avoid echo
    socket.to(clientChannel).emit('voice_transmit', {
      sender: clientCallsign,
      audio: audioData.audio,
      timestamp: getTimestamp(),
    });
  });


  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`[SERVER] Client disconnected: ${clientCallsign} (${socket.id})`);
    activeUsers.delete(socket.id);

    io.to(clientChannel).emit('message', {
      id: `sys-${Date.now()}`,
      sender: 'SYSTEM',
      text: `${clientCallsign} disconnected.`,
      channel: clientChannel,
      timestamp: getTimestamp(),
      isSystem: true,
    });

    broadcastUserList();
  });
});

function broadcastUserList() {
  const users = [];
  // Add active connected sockets
  activeUsers.forEach((value) => {
    users.push({ callsign: value.callsign, channel: value.channel, isSimulated: false, status: 'ACTIVE' });
  });



  // Broadcast to all sockets
  io.emit('user_list', users);
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', clientsCount: io.engine.clientsCount });
});

server.listen(PORT, () => {
  console.log(`[SERVER] Tactical Chat Socket Server running on port ${PORT}`);
});
