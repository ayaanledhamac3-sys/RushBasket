import express from 'express';
import {
  createSupplierPayment,
  getSupplierPayments,
  deleteSupplierPayment,
} from '../controllers/supplierPaymentController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// GET ALL PAYMENTS
router.get('/', getSupplierPayments);

// CREATE PAYMENT
router.post('/', authMiddleware, createSupplierPayment);

// DELETE PAYMENT
router.delete('/:id', authMiddleware, deleteSupplierPayment);

export default router;