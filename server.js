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

// Track active camera feeds  { socketId -> feedData }
const cameraFeeds = new Map();

// Helper to generate timestamps
function getTimestamp() {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // HH:MM:SS
}

// Preset channels
const CHANNELS = ['#dispatch', '#tactical-1', '#intel-ops'];

function broadcastCameraFeeds() {
  const feeds = [];
  cameraFeeds.forEach((feed) => feeds.push(feed));
  io.emit('camera_feeds', feeds);
}

// Sockets setup below

io.on('connection', (socket) => {
  console.log(`[SERVER] Client connected: ${socket.id}`);

  // Default callsign until user registers
  let clientCallsign = `UNIT-${socket.id.substring(0, 4).toUpperCase()}`;
  let clientChannel = '#dispatch';
  let hasCamera = false;

  socket.join(clientChannel);

  // Send init data to the new client
  socket.emit('init', {
    defaultCallsign: clientCallsign,
    channels: CHANNELS,
    activeChannel: clientChannel,
  });

  // Send current camera feeds to this new client
  const currentFeeds = [];
  cameraFeeds.forEach((feed) => currentFeeds.push(feed));
  socket.emit('camera_feeds', currentFeeds);

  // Handle register/update callsign
  socket.on('register', (data) => {
    clientCallsign = data.callsign.toUpperCase();
    const clientType = data.clientType || 'chat';
    activeUsers.set(socket.id, { callsign: clientCallsign, channel: clientChannel, clientType });
    console.log(`[SERVER] Socket ${socket.id} registered callsign: ${clientCallsign} (${clientType})`);

    // Broadcast updated user list
    broadcastUserList();

    // Broadcast system message
    if (clientType !== 'radio') {
      io.to(clientChannel).emit('message', {
        id: `sys-${Date.now()}`,
        sender: 'SYSTEM',
        text: `${clientCallsign} has connected to ${clientChannel}.`,
        channel: clientChannel,
        timestamp: getTimestamp(),
        isSystem: true,
      });
    }
  });

  // ── Camera feed events ───────────────────────────────────────────────────
  // Officer registers their camera (called when body cam page loads in officer mode)
  socket.on('camera_register', (data) => {
    hasCamera = true;
    const feed = {
      id: socket.id,
      callsign: data.callsign || clientCallsign,
      unit: data.unit || clientCallsign,
      isRecording: data.isRecording ?? true,
      isStreaming: data.isStreaming ?? true,
      lat: data.lat ?? 25.1972,
      lng: data.lng ?? 55.2744,
      battery: data.battery ?? 100,
      signal: data.signal ?? 5,
      status: 'ACTIVE',
      fps: data.fps ?? 30,
      connectedAt: getTimestamp(),
    };
    cameraFeeds.set(socket.id, feed);
    console.log(`[SERVER] Camera registered: ${feed.callsign}`);
    broadcastCameraFeeds();
  });

  // Officer sends a live status update
  socket.on('camera_update', (data) => {
    if (!cameraFeeds.has(socket.id)) return;
    const existing = cameraFeeds.get(socket.id);
    const updated = {
      ...existing,
      ...data,
      id: socket.id,               // never override id
      callsign: existing.callsign, // never override callsign
    };
    cameraFeeds.set(socket.id, updated);
    broadcastCameraFeeds();
  });

  // Admin requests latest feeds
  socket.on('camera_get_feeds', () => {
    const feeds = [];
    cameraFeeds.forEach((f) => feeds.push(f));
    socket.emit('camera_feeds', feeds);
  });

  // Officer voluntarily unregisters their camera (e.g. stops streaming or role switch)
  socket.on('camera_unregister', () => {
    if (cameraFeeds.has(socket.id)) {
      cameraFeeds.delete(socket.id);
      hasCamera = false;
      console.log(`[SERVER] Camera unregistered: ${clientCallsign}`);
      broadcastCameraFeeds();
    }
  });

  // Officer broadcasts a camera frame (base64)
  socket.on('camera_frame', (data) => {
    socket.broadcast.emit('camera_frame', {
      id: socket.id,
      frame: data.frame,
    });
  });


  // ── Existing events ──────────────────────────────────────────────────────
  // Handle joining a channel
  socket.on('join_channel', (channel) => {
    if (!CHANNELS.includes(channel)) return;

    const oldChannel = clientChannel;
    socket.leave(oldChannel);
    socket.join(channel);
    clientChannel = channel;

    const userData = activeUsers.get(socket.id);
    const userType = userData?.clientType || 'chat';

    if (activeUsers.has(socket.id)) {
      activeUsers.get(socket.id).channel = channel;
    }

    console.log(`[SERVER] Client ${clientCallsign} changed channel to ${channel}`);

    if (userType !== 'radio') {
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
    }

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
    const userData = activeUsers.get(socket.id);
    const userType = userData?.clientType || 'chat';
    activeUsers.delete(socket.id);

    // Remove camera feed if registered
    if (hasCamera && cameraFeeds.has(socket.id)) {
      cameraFeeds.delete(socket.id);
      console.log(`[SERVER] Camera feed removed: ${clientCallsign}`);
      broadcastCameraFeeds();
    }

    if (userType !== 'radio') {
      io.to(clientChannel).emit('message', {
        id: `sys-${Date.now()}`,
        sender: 'SYSTEM',
        text: `${clientCallsign} disconnected.`,
        channel: clientChannel,
        timestamp: getTimestamp(),
        isSystem: true,
      });
    }

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
  res.json({ status: 'ok', clientsCount: io.engine.clientsCount, cameraFeeds: cameraFeeds.size });
});

server.listen(PORT, () => {
  console.log(`[SERVER] Tactical Chat Socket Server running on port ${PORT}`);
});
