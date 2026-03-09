import express, { Request, Response, Router } from 'express';
import Notification from '../models/notification';

const router: Router = express.Router();

// --- 1. GET ALL NOTIFICATIONS FOR A USER ---
router.get('/user/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    // Sort by newest first
    const notifications = await Notification.find({ userId: req.params.userId })
                                            .sort({ createdAt: -1 });
    res.json({ success: true, data: notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- 2. CREATE A NEW NOTIFICATION ---
// (You will call this internally from other backend controllers, e.g., when a quiz finishes)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, cohort, type, title, message } = req.body;

    if (!userId || !cohort || !type || !title || !message) {
      res.status(400).json({ success: false, message: 'Missing required fields' });
      return;
    }

    const newNotification = new Notification({
      userId,
      cohort,
      type,
      title,
      message
    });

    await newNotification.save();
    res.status(201).json({ success: true, data: newNotification });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- 3. MARK SINGLE NOTIFICATION AS READ ---
router.patch('/:id/read', async (req: Request, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true } // Returns the updated document
    );

    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.json({ success: true, data: notification });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- 4. MARK ALL NOTIFICATIONS AS READ ---
router.patch('/user/:userId/read-all', async (req: Request, res: Response): Promise<void> => {
  try {
    await Notification.updateMany(
      { userId: req.params.userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- 5. DELETE A NOTIFICATION ---
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' });
      return;
    }

    res.json({ success: true, message: 'Notification deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;