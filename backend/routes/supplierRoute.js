import express from 'express';
import { getSuppliers, createSupplier, deleteSupplier, updateSupplier } from '../controllers/supplierController.js';

const supplierRouter = express.Router();

supplierRouter.get('/', getSuppliers);
supplierRouter.post('/', createSupplier);
supplierRouter.put('/:id', updateSupplier);
supplierRouter.delete('/:id', deleteSupplier);

export default supplierRouter;