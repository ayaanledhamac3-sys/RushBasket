import express from 'express';
import { getCustomers, createCustomer, deleteCustomer, updateCustomer } from '../controllers/customerController.js';

const customerRouter = express.Router();

customerRouter.get('/', getCustomers);
customerRouter.post('/', createCustomer);
customerRouter.put('/:id', updateCustomer);
customerRouter.delete('/:id', deleteCustomer);

export default customerRouter;