import express, { Request, Response, Router } from 'express';
import HelpTicket from '../models/HelpTicket';

const router: Router = express.Router();

router.post('/ticket', async (req: Request, res: Response): Promise<void> => {
  try {
    const ticket = await HelpTicket.create(req.body);
    res.status(201).json({ success: true, data: ticket });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;