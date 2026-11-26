import systemstatusController from "../controllers/systemstatus.controller";
import { internalAuthMiddleware } from "../middlewares/auth.middleware";

const router = require('express').Router();

router.get('/',systemstatusController.getGeneralStatus)
router.get('/:module',systemstatusController.getStatus)

router.post('/mqtt',internalAuthMiddleware,systemstatusController.setMqttStatus)

module.exports = router;