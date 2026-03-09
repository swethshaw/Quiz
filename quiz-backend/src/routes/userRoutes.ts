import express, { Request, Response, Router } from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User';
import Notification from '../models/notification';
const router: Router = express.Router();

// --- REGISTER ROUTE ---
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate input
    if (!name || !email || !password) {
      res.status(400).json({ success: false, message: 'Please provide all fields' });
      return;
    }

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ success: false, message: 'Account with this email already exists' });
      return;
    }

    // 3. Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create user
    const newUser = new User({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
    });

    await newUser.save();

    // 5. Remove password from the response data for security
    const userObject = newUser.toObject();
    delete userObject.password;

    res.status(201).json({ success: true, data: userObject });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- LOGIN ROUTE ---
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // 1. Validate input
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Please provide email and password' });
      return;
    }

    // 2. Find User
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(404).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    // 3. Verify Password
    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    // 4. Remove password before sending to client
    const userObject = user.toObject();
    delete userObject.password;

    // --- NEW: Create Login Notification ---
    try {
      const loginNotif = new Notification({
        userId: user._id,
        cohort: "System", // Using a generic cohort name for account-level alerts
        type: "achievement", // Reusing existing enum type that fits best
        title: "Security Alert: New Login",
        message: `Welcome back, ${user.name}! A new login was detected on your account.`
      });
      await loginNotif.save();
    } catch (notifError) {
      // We log this error but do NOT return a 500 status. 
      // The user should still be able to log in even if the notification fails.
      console.error("Failed to generate login notification:", notifError);
    }
    // --------------------------------------

    res.json({ success: true, data: userObject });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- GET USER BY ID ---
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    // Use .select('-password') to ensure the database doesn't return the password field
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    
    res.json({ success: true, data: user });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;