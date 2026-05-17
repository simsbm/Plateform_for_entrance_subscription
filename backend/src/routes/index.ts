import { Router } from 'express';
import { authRouter }        from './auth.routes';
import { candidatureRouter } from './candidature.routes';
import { agentRouter }       from './agent.routes';
import { pdfRouter }         from './pdf.routes';
import { centresRouter }     from './centres.routes';
import { chatRouter }        from './chat.routes';
import { adminRouter }       from './admin.routes';

export const router = Router();

router.use('/auth',          authRouter);
router.use('/candidatures',  candidatureRouter);
router.use('/agent',         agentRouter);
router.use('/pdf',           pdfRouter);
router.use('/centres',       centresRouter);
router.use('/chat',          chatRouter);
router.use('/admin',         adminRouter);
