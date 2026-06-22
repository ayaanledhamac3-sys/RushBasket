import './loadEnv.js';
import cors from 'cors';
import express from 'express';
import { connectDB } from './config/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

import authMiddleware from './middleware/auth.js';
import userRouter from './routes/userRoute.js';
import itemrouter from './routes/productRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderrouter from './routes/orderRoute.js';
import customerRouter from './routes/customerRoute.js';
import supplierRouter from './routes/supplierRoute.js';
import purchaseRouter from './routes/purchaseRoute.js';
import supplierPaymentRouter from './routes/supplierPaymentRoute.js';

const app = express();
const port = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================= CORS CONFIG (FIXED) =================
const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://localhost:5176',
  'http://localhost:5177',
];

const extraCorsOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const allowedCorsOrigins = [...new Set([...defaultCorsOrigins, ...extraCorsOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // allow Postman / server-to-server requests
    if (!origin) return callback(null, true);

    if (allowedCorsOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
}));

// ================= MIDDLEWARE =================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================= ROUTES =================
app.use('/api/user', userRouter);
app.use('/api/cart', authMiddleware, cartRouter);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/items', itemrouter);
app.use('/api/orders', orderrouter);
app.use('/api/customers', customerRouter);

// Supplier system (3 pages system)
app.use('/api/suppliers', supplierRouter);
app.use('/api/purchases', purchaseRouter);
app.use('/api/supplier-payments', supplierPaymentRouter);

// ================= HEALTH CHECK =================
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'API Working',
    status: 'OK',
  });
});

// ================= DB + SERVER START =================
const start = async () => {
  try {
    await connectDB();
    console.log('DB Connected Successfully');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  }

  app.listen(port, () =>
    console.log(`🚀 Server running on http://localhost:${port}`)
  );
};

start();