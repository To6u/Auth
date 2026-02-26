import 'dotenv/config';
import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { registerDevRoutes } from './dev-routes';
import { apiLimiter } from './config/rate-limit.config';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { logger } from './utils/logger';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';

const app: Express = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// 🔐 Security: Helmet
app.use(helmet());

// 📦 Parsing
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// 🌐 CORS
const corsOptions = {
    origin: NODE_ENV === 'production'
        ? ['https://yourdomain.com']
        : 'http://localhost:5173',   // Vite dev server — wildcard несовместим с credentials: true
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));

// 📊 Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
    logger.info(`${req.method} ${req.url} - ${req.ip}`);
    next();
});

// 🛡️ Rate limiting
app.use('/api', apiLimiter);

// 💚 Health check
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// 🔧 Dev routes (только в development)
if (NODE_ENV !== 'production') {
    registerDevRoutes(app);
}

// 📍 Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);

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
    logger.info(
        `🔐 JWT Secret: ${JWT_SECRET === 'fallback-secret-key' ? '⚠️ ИСПОЛЬЗУЕТСЯ ДЕФОЛТНЫЙ!' : '✅ Настроен'}`
    );
    logger.info('='.repeat(50));
});

// 🛑 Graceful shutdown
const gracefulShutdown = (signal: string): void => {
    logger.info(`${signal} получен, закрываю сервер...`);
    server.close(() => {
        logger.info('✅ HTTP сервер закрыт');
        // db.close(); // Раскомментируй если используешь connection pool
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