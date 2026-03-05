import express, { Request, Response, Router } from 'express';
import Result from '../models/Result';

const router: Router = express.Router();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const newResult = await Result.create(req.body);
    res.status(201).json({ success: true, data: newResult });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const results = await Result.find({ userId: req.params.userId })
                                .populate('topicId', 'title category')
                                .sort({ createdAt: -1 });
    res.json({ success: true, data: results });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;