import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

connectDB();

app.use(cors({
  origin: 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true
}));
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('peer Backend is live (powered by TypeScript)!');
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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});