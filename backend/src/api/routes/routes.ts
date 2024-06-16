import { Router } from 'express';
import { getContractAnalysis, convertToSolidity, convertToRust, getAuditReport, compileContract } from '../controllers/Controller';

const router = Router();

router.post('/analysis', getContractAnalysis);
router.post('/convertToSolidity', convertToSolidity)
router.post('/convertToRust', convertToRust)
router.post("/getAuditReport", getAuditReport);
router.post("/compileContract", compileContract)

export default router;
