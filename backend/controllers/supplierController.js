import mongoose from 'mongoose';
import * as SupplierMod from '../models/supplierModel.js';
const Supplier = SupplierMod.Supplier || SupplierMod.default || SupplierMod;

const ensureDbConnected = (res) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({ message: 'Database not connected.' });
        return false;
    }
    return true;
};

export const getSuppliers = async (req, res, next) => {
    try {
        if (!ensureDbConnected(res)) return;
        const suppliers = await Supplier.find().sort({ createdAt: -1 });
        res.json(suppliers);
    } catch (err) { next(err); }
};

export const createSupplier = async (req, res, next) => {
    try {
        if (!ensureDbConnected(res)) return;
        const { companyName, contactPerson, email, phone, location, status, notes } = req.body;
        if (!companyName || !contactPerson || !location) {
            return res.status(400).json({ message: 'companyName, contactPerson and location are required' });
        }
        const supplier = await Supplier.create({ companyName, contactPerson, email, phone, location, status, notes });
        res.status(201).json(supplier);
    } catch (err) { next(err); }
};

export const deleteSupplier = async (req, res, next) => {
    try {
        if (!ensureDbConnected(res)) return;
        const id = req.params.id;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid supplier id' });
        const deleted = await Supplier.findByIdAndDelete(id);
        if (!deleted) { res.status(404); throw new Error('Supplier not found'); }
        res.json({ message: 'Supplier removed' });
    } catch (err) { next(err); }
};

export const updateSupplier = async (req, res, next) => {
    try {
        if (!ensureDbConnected(res)) return;
        const updated = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) { res.status(404); throw new Error('Supplier not found'); }
        res.json(updated);
    } catch (err) { next(err); }
};