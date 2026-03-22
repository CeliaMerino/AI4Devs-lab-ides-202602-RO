import { Router } from 'express';
import { createCandidate } from '../presentation/controllers/candidateController';

const router = Router();
router.post('/candidates', createCandidate);

export { router as candidateRoutes };
