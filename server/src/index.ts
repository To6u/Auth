import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import helmet from 'helmet';
import { apiLimiter } from './config/rate-limit.config';
import db from './db';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import authRoutes from './routes/auth.routes';
import challengeRoutes from './routes/challenges.routes';
import habitRoutes from './routes/habits.routes';
import sectionRoutes from './routes/sections.routes';
import taskRoutes from './routes/tasks.routes';
import trashRoutes from './routes/trash.routes';
import userRoutes from './routes/user.routes';
import { logger } from './utils/logger';

const app: Express = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET не задан — запуск прерван');
}

// 🔐 Security: Helmet
app.use(helmet());

// 📦 Parsing
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 🌐 CORS
const corsOptions = {
    origin: NODE_ENV === 'production' ? ['https://yourdomain.com'] : 'http://localhost:5173', // Vite dev server — wildcard несовместим с credentials: true
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));

// 📊 Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url} - ${req.ip}`);
    next();
});

// 🛡️ Rate limiting
app.use('/api', apiLimiter);

// 💚 Health check
app.get('/health', (_req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// 📍 Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/trash', trashRoutes);

// ❌ 404 handler
app.use(notFoundHandler);

// ❌ Error handler (последним!)
app.use(errorHandler);

// 🚀 Start server
const server = app.listen(PORT, () => {
    logger.info('='.repeat(50));
    logger.info(`🚀 Сервер запущен на http://localhost:${PORT}`);
    logger.info(`📝 Режим: ${NODE_ENV}`);
    logger.info(`💚 Health check: http://localhost:${PORT}/health`);
    logger.info(`🔐 JWT Secret: ✅ Настроен`);
    logger.info('='.repeat(50));
});

// 🛑 Graceful shutdown
const gracefulShutdown = (signal: string): void => {
    logger.info(`${signal} получен, закрываю сервер...`);
    server.close(() => {
        logger.info('✅ HTTP сервер закрыт');
        db.close();
        logger.info('✅ База данных закрыта');
        process.exit(0);
    });

    // Принудительное завершение через 10 секунд
    setTimeout(() => {
        logger.error('⚠️ Принудительное завершение через таймаут');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
