import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  avatarColor: string;
  role: 'student' | 'admin';
  gender?: string;
  birthday?: Date;
  work?: string;
  education?: string;
  experience?: string;
  skills?: string[];
  socialLinks?: {
    github?: string;
    linkedin?: string;
    twitter?: string;
  };
  createdAt: Date;
}

const userSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatarColor: { type: String, default: 'bg-violet-500' },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  gender: { type: String },
  birthday: { type: Date },
  work: { type: String },
  education: { type: String },
  experience: { type: String },
  skills: [{ type: String }],
  socialLinks: {
    github: { type: String },
    linkedin: { type: String },
    twitter: { type: String }
  },
  
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUser>('User', userSchema);