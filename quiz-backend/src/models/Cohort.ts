import mongoose, { Document, Schema } from 'mongoose';

export interface ICohort extends Document {
  name: string;
  description?: string;
}

const cohortSchema: Schema = new Schema({
  name: { type: String, required: true },
  description: { type: String }
});

export default mongoose.model<ICohort>('Cohort', cohortSchema);