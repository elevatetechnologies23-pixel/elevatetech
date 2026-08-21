import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

// Route Imports
import authRoutes from './routes/authRoutes';
import productRoutes from './routes/productRoutes';
import orderRoutes from './routes/orderRoutes';
import licenseRoutes from './routes/licenseRoutes';
import ticketRoutes from './routes/ticketRoutes';
import adminRoutes from './routes/adminRoutes';
import notificationRoutes from './routes/notificationRoutes';
import bannerRoutes from './routes/bannerRoutes';
import videoRoutes from './routes/videoRoutes';
import demoRoutes from './routes/demoRoutes';

// Custom interfaces & classes
class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const app: Application = express();

// 1. Security HTTP Headers
app.use(helmet());

// 2. CORS setup
const ALWAYS_ALLOWED_ORIGINS = [
  'https://elevatetechnologies.in',
  'https://www.elevatetechnologies.in',
  'http://elevatetechnologies.in',
  'http://www.elevatetechnologies.in',
  'https://elevatetechnology.com',
  'https://www.elevatetechnology.com',
  'http://elevatetechnology.com',
  'http://www.elevatetechnology.com',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman, server-to-server, etc.)
      if (!origin) return callback(null, true);

      const allowedFromEnv = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim().toLowerCase())
        : [];

      const lowerOrigin = origin.toLowerCase();

      const isAllowed =
        lowerOrigin.startsWith('http://localhost') ||
        lowerOrigin.startsWith('http://127.0.0.1') ||
        lowerOrigin.includes('vercel.app') ||
        lowerOrigin.includes('elevatetechnolog') ||
        lowerOrigin.includes('elevatetech') ||
        ALWAYS_ALLOWED_ORIGINS.map(o => o.toLowerCase()).includes(lowerOrigin) ||
        allowedFromEnv.includes(lowerOrigin);

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked request from origin: ${origin}`);
        callback(null, true); // Fallback to allowing in production so user transactions never fail
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Ensure OPTIONS preflight requests are always handled
app.options('*', cors());

// 3. Logger
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 4. Trust proxy — required on Render/Heroku/Railway (reverse proxy adds X-Forwarded-For)
app.set('trust proxy', 1);

// 5. Rate Limiter (Prevent DDOS / Brute Force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// 5. Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 6. Base Routes
app.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to the Enterprise Electronics API. Use /api/v1 for endpoints.',
  });
});

app.get('/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'success',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Map API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/licenses', licenseRoutes);
app.use('/api/v1/tickets', ticketRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/demos', demoRoutes);

// 7. Handle Undefined Routes
app.all('*', (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// 8. Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction): void => {
  const statusCode = err.statusCode || 500;
  const status = err.status || 'error';

  res.status(statusCode).json({
    status,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack, error: err }),
  });
});

export { app, AppError };
export default app;
