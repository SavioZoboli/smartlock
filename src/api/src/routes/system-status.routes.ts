import systemstatusController from "../controllers/systemstatus.controller";

const router = require('express').Router();

router.get('/',systemstatusController.getGeneralStatus)
router.get('/:module',systemstatusController.getStatus)

router.post('/mqtt',systemstatusController.setMqttStatus)

module.exports = router;