require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { registerHandlers, setupSocketMiddleware } = require('./sockets');
const { startCleanupWorker } = require('./utils/cleanup');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const app = express();

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST']
}));
app.use(express.json());

const createRoomRoutes = require('./routes/roomRoutes');

const activeRooms = new Map(); // Global in-memory store: roomCode -> Room

app.use('/api/room', createRoomRoutes(activeRooms));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST']
  }
});

setupSocketMiddleware(io);

io.on('connection', (socket) => {
  logger.log(`Socket connected: ${socket.id}`);
  registerHandlers(io, socket, activeRooms);
});

startCleanupWorker(io, activeRooms);

server.listen(PORT, () => {
  logger.log(`Strokelier backend listening on port ${PORT}`);
});
