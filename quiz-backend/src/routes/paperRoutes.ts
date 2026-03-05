import express, { Request, Response, Router } from 'express';
import Paper from '../models/Paper';

const router: Router = express.Router();

router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const papers = await Paper.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: papers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, title } = req.body;
    const existingPaper = await Paper.findOne({ userId, title: title.trim() });
    if (existingPaper) {
      res.status(400).json({ success: false, message: 'You already have a paper with this name. Please choose a unique name.' });
      return;
    }

    const newPaper = await Paper.create(req.body);
    res.status(201).json({ success: true, data: newPaper });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const paper = await Paper.findById(req.params.id);
    if (!paper) {
      res.status(404).json({ success: false, message: 'Paper not found' });
      return;
    }
    res.json({ success: true, data: paper });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;