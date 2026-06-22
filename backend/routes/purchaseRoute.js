import express from 'express';
import {
    createPurchase,
    getPurchases,
    getPurchaseById,
    deletePurchase,
} from '../controllers/purchaseController.js';
import authMiddleware from '../middleware/auth.js';

const purchaseRouter = express.Router();

// 🎯 Protected endpoints
purchaseRouter.post('/',    authMiddleware, createPurchase);
purchaseRouter.delete('/:id', authMiddleware, deletePurchase);

// 🌐 Public endpoints
purchaseRouter.get('/',    getPurchases);
purchaseRouter.get('/:id', getPurchaseById);

export default purchaseRouter;