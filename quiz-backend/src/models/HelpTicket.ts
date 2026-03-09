import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  userId: mongoose.Types.ObjectId;
  userName: string;
  text: string;
  createdAt: Date;
}

export interface IHelpTicket extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string; // Added for easy display
  title: string;    // Added
  reportType: 'question_error' | 'website_bug' | 'improvement';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  likes: mongoose.Types.ObjectId[]; // Store User IDs who liked
  comments: IComment[];             // Nested comments array
  createdAt: Date;
}

const helpTicketSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userName: { type: String, required: true },
  title: { type: String, required: true },
  reportType: { type: String, enum: ['question_error', 'website_bug', 'improvement'], required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  comments: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IHelpTicket>('HelpTicket', helpTicketSchema);