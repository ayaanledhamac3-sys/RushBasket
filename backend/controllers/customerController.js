import mongoose from 'mongoose';
import { Customer } from '../models/customerModel.js';

const ensureDbConnected = (res) => {
    if (mongoose.connection.readyState !== 1) {
        res.status(503).json({ message: 'Database not connected.' });
        return false;
    }
    return true;
};

export const getCustomers = async (req, res, next) => {
    try {
        if (!ensureDbConnected(res)) return;
        const customers = await Customer.find().sort({ createdAt: -1 });
        res.json(customers);
    } catch (err) { next(err); }
};

export const createCustomer = async (req, res, next) => {
    try {
        if (!ensureDbConnected(res)) return;
        const { name, email, phone, location, notes } = req.body;
        const customer = await Customer.create({ name, email, phone, location, notes });
        res.status(201).json(customer);
    } catch (err) { next(err); }
};

export const deleteCustomer = async (req, res, next) => {
    try {
        if (!ensureDbConnected(res)) return;
        const deleted = await Customer.findByIdAndDelete(req.params.id);
        if (!deleted) { res.status(404); throw new Error('Customer not found'); }
        res.json({ message: 'Customer removed' });
    } catch (err) { next(err); }
};

export const updateCustomer = async (req, res, next) => {
    try {
        if (!ensureDbConnected(res)) return;
        const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) { res.status(404); throw new Error('Customer not found'); }
        res.json(updated);
    } catch (err) { next(err); }
};