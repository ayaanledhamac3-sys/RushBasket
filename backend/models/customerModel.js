import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    notes: { type: String, default: '' },
}, { timestamps: true });

export const Customer = mongoose.models.Customer || mongoose.model('Customer', customerSchema);