import mongoose, { Document, Schema } from 'mongoose';

export interface IHelpTicket extends Document {
  userId: mongoose.Types.ObjectId;
  reportType: 'question_error' | 'website_bug' | 'improvement';
  description: string;
  status: 'pending' | 'reviewed' | 'resolved';
  createdAt: Date;
}

const helpTicketSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reportType: { type: String, enum: ['question_error', 'website_bug', 'improvement'], required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed', 'resolved'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IHelpTicket>('HelpTicket', helpTicketSchema);