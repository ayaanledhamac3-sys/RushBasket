import * as PurchaseMod from '../models/purchaseModel.js';
import * as SupplierMod from '../models/supplierModel.js';
const Purchase = PurchaseMod.Purchase || PurchaseMod.default || PurchaseMod;
const Supplier = SupplierMod.Supplier || SupplierMod.default || SupplierMod;

export const getPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.find({})
      .populate('supplierId', 'companyName email phone')
      .sort({ createdAt: -1 })
      .lean();
    res.json(purchases);
  } catch (err) { next(err); }
};

export const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplierId', 'companyName phone email')
      .lean();
    if (!purchase) return res.status(404).json({ message: 'Purchase not found' });
    res.json(purchase);
  } catch (err) { next(err); }
};

export const createPurchase = async (req, res) => {
  try {
    const { supplierId, purchaseDate, notes, details } = req.body;

    if (!supplierId)
      return res.status(400).json({ error: 'supplierId is required' });
    if (!Array.isArray(details) || details.length === 0)
      return res.status(400).json({ error: 'details array is required' });

    const purchase = new Purchase({
      supplierId,
      purchaseDate: purchaseDate || Date.now(),
      details: details.map(d => ({
        productName: d.productName,
        quantity:    Number(d.quantity),
        unitPrice:   Number(d.unitPrice),
      })),
      paidAmount: 0,
      notes: notes || '',
    });

    await purchase.save();
    await Supplier.findByIdAndUpdate(supplierId, { $inc: { balance: purchase.totalAmount } });
    res.status(201).json(purchase);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deletePurchase = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
    await Supplier.findByIdAndUpdate(purchase.supplierId, { $inc: { balance: -purchase.remainingAmount } });
    await purchase.deleteOne();
    res.json({ message: 'Purchase deleted successfully' });
  } catch (err) { next(err); }
};