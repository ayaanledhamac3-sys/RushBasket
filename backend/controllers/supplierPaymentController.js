import mongoose from 'mongoose';
import * as SupplierMod from '../models/supplierModel.js';
const Supplier = SupplierMod.Supplier || SupplierMod.default || SupplierMod;

const getSupplierPaymentModel = async () => {
  // Ensure the model file is executed so Mongoose registers the model
  await import('../models/supplierPaymentModel.js');
  if (!mongoose.models.SupplierPayment) {
    // Fallback: register schema inline if the model wasn't registered for some reason
    const supplierPaymentSchema = new mongoose.Schema({
      supplierId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
      purchaseId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Purchase', default: null },
      amount:        { type: Number, required: true, min: 0.01 },
      paymentDate:   { type: Date, default: Date.now },
      paymentMethod: { type: String, enum: ['Cash', 'Bank Transfer', 'Mobile Money', 'Cheque', 'Other'], default: 'Cash' },
      notes:         { type: String, default: '' },
    }, { timestamps: true });
    mongoose.model('SupplierPayment', supplierPaymentSchema);
  }
  return mongoose.models.SupplierPayment;
};

export const getSupplierPayments = async (req, res) => {
  try {
    const SupplierPayment = await getSupplierPaymentModel();
    const payments = await SupplierPayment.find()
      .populate('supplierId', 'companyName')
      .sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createSupplierPayment = async (req, res) => {
  try {
    const SupplierPayment = await getSupplierPaymentModel();
    const payment = new SupplierPayment(req.body);
    await payment.save();
    await Supplier.findByIdAndUpdate(payment.supplierId, { $inc: { balance: -payment.amount } });
    res.status(201).json(payment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteSupplierPayment = async (req, res) => {
  try {
    const SupplierPayment = await getSupplierPaymentModel();
    const payment = await SupplierPayment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    await Supplier.findByIdAndUpdate(payment.supplierId, { $inc: { balance: payment.amount } });
    await payment.deleteOne();
    res.json({ message: 'Payment deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};