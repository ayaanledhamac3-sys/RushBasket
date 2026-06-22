import readline from 'readline';
import './loadEnv.js';
import { connectDB } from '../config/db.js';
import { Supplier } from '../models/supplierModel.js';
import Purchase from '../models/purchaseModel.js';
import SupplierPayment from '../models/supplierPaymentModel.js';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

const question = (q) => new Promise((res) => rl.question(q, res));

const run = async () => {
  console.log('This will DELETE ALL suppliers, purchases, and supplier payments from the database.');
  const answer = (await question('Type YES to confirm: ')).trim();
  rl.close();

  if (answer !== 'YES') {
    console.log('Aborted. No changes made.');
    process.exit(0);
  }

  try {
    await connectDB();

    const s = await Supplier.deleteMany({});
    const p = await Purchase.deleteMany({});
    const sp = await SupplierPayment.deleteMany({});

    console.log(`Suppliers deleted: ${s.deletedCount || s.n || 0}`);
    console.log(`Purchases deleted: ${p.deletedCount || p.n || 0}`);
    console.log(`SupplierPayments deleted: ${sp.deletedCount || sp.n || 0}`);

    console.log('Done. You can now add your own supplier data via the admin UI.');
    process.exit(0);
  } catch (err) {
    console.error('Error clearing data:', err);
    process.exit(1);
  }
};

run();
