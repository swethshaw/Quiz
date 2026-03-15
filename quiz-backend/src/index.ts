import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/db';

import quizRoutes from './routes/quizRoutes';
import userRoutes from './routes/userRoutes';
import resultRoutes from './routes/resultRoutes';
import helpRoutes from './routes/helpRoutes';
import roomRoutes from './routes/roomRoutes';
import paperRoutes from './routes/paperRoutes';
import debugRoute from './routes/debugRoute';
import notificationRoutes from './routes/notificationRoutes';
import leaderboardRoute from './routes/leaderboardRoute';

dotenv.config();

const app: Application = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'https://quiz-six-swart-50.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  }
});

connectDB();

app.use(cors({
  origin: ['http://localhost:5173', 'https://quiz-six-swart-50.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json());
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join_room', (roomCode: string) => {
    const code = roomCode.toUpperCase();
    socket.join(code);
    console.log(`Socket ${socket.id} joined room: ${code}`);
  });

  socket.on('start_quiz', (roomCode: string) => {
    io.to(roomCode.toUpperCase()).emit('quiz_started');
  });

  socket.on('participant_event', ({ roomCode, data }) => {
    socket.to(roomCode.toUpperCase()).emit('update_proctor_view', data);
  });

  socket.on('host_action', ({ roomCode, action, targetUserId }) => {
    io.to(roomCode.toUpperCase()).emit('force_action', { action, targetUserId });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.get('/', (req: Request, res: Response) => {
  res.send('Peer Backend is live and socket-enabled!');
});

app.use('/api/quiz', quizRoutes);
app.use('/api/users', userRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/debug', debugRoute);
app.use('/api/leaderboard', leaderboardRoute);

const PORT: number = parseInt(process.env.PORT as string, 10) || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server & Sockets running on http://localhost:${PORT}`);
});

export { io };