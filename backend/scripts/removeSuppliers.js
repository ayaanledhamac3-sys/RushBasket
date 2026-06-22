import './loadEnv.js';
import { connectDB } from '../config/db.js';
import { Supplier } from '../models/supplierModel.js';
import Purchase from '../models/purchaseModel.js';
import SupplierPayment from '../models/supplierPaymentModel.js';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node scripts/removeSuppliers.js <email|companyName|id> [more identifiers...]');
  console.log('Example: node scripts/removeSuppliers.js emily@sunrisedairy.com mark@atlanticsea.com');
  process.exit(0);
}

const run = async () => {
  const ok = await connectDB();
  if (!ok) process.exit(1);

  for (const ident of args) {
    try {
      // Try by email first
      let sup = await Supplier.findOne({ email: ident });
      if (!sup) sup = await Supplier.findOne({ companyName: ident });
      if (!sup && /^[0-9a-fA-F]{24}$/.test(ident)) sup = await Supplier.findById(ident);

      if (!sup) {
        console.log(`Not found: ${ident}`);
        continue;
      }

      const sid = sup._id;
      const delSup = await Supplier.deleteOne({ _id: sid });
      const delPurch = await Purchase.deleteMany({ supplierId: sid });
      const delPays = await SupplierPayment.deleteMany({ supplierId: sid });

      console.log(`Removed supplier ${sup.companyName || sup.contactPerson || ident} (${sup.email || sid})`);
      console.log(`  Suppliers removed: ${delSup.deletedCount || 0}`);
      console.log(`  Purchases removed: ${delPurch.deletedCount || 0}`);
      console.log(`  SupplierPayments removed: ${delPays.deletedCount || 0}`);
    } catch (err) {
      console.error(`Error removing ${ident}:`, err.message || err);
    }
  }

  process.exit(0);
};

run();
