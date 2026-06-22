import mongoose from 'mongoose';

const supplierSchema = new mongoose.Schema({
    companyName: { type: String, required: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    location: { type: String, required: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    notes: { type: String, default: '' },
}, { timestamps: true });

export const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', supplierSchema);