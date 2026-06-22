import mongoose from 'mongoose';

const detailSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalPrice: { type: Number },
}, { _id: false });

const purchaseSchema = new mongoose.Schema({
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
  purchaseDate: { type: Date, default: Date.now },
  details: { type: [detailSchema], default: [] },
  totalAmount: { type: Number, default: 0 },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number, default: 0 },
  status: { type: String, enum: ['Pending', 'Partial', 'Paid'], default: 'Pending' },
  notes: { type: String, default: '' },
}, { timestamps: true });

purchaseSchema.pre('save', function (next) {
  let total = 0;

  this.details.forEach(d => {
    d.totalPrice = Number(d.quantity) * Number(d.unitPrice);
    total += d.totalPrice;
  });

  this.totalAmount = total;
  this.remainingAmount = Math.max(0, total - (this.paidAmount || 0));

  if (this.remainingAmount <= 0) this.status = 'Paid';
  else if (this.paidAmount > 0) this.status = 'Partial';
  else this.status = 'Pending';

  next();
});

const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);

export { Purchase };
export default Purchase;