import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { chat, chatStream } from '../controllers/chat.controller';

function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(
        header.slice(7),
        process.env.JWT_SECRET!
      ) as { id: string; email: string; role: Role };
      req.user = payload;
    } catch {
      // Token invalide — on continue sans utilisateur
    }
  }
  next();
}

const chatLimiter = rateLimit({
  windowMs: 60 * 1000,      // 1 minute
  max: 20,                   // 20 requêtes par minute par IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Trop de requêtes. Veuillez patienter avant de réessayer.' },
});

export const chatRouter = Router();

chatRouter.post('/',        chatLimiter, optionalAuth, chat);
chatRouter.post('/stream',  chatLimiter, optionalAuth, chatStream);
