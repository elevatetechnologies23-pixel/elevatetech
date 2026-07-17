import { Schema, model } from 'mongoose';
import type { ISettings } from '../types/models';

const settingsSchema = new Schema<ISettings>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true }
}, {
  timestamps: true
});

const Settings = model<ISettings>('Settings', settingsSchema);
export default Settings;
