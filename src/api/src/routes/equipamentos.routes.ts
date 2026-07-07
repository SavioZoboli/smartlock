import equipamentoController from "../controllers/equipamento.controller";

const router = require('express').Router();



router.get('/',equipamentoController.listAll)

router.post('/bulkCreate',equipamentoController.bulkCreate)

router.get('/:id',equipamentoController.getById)

router.put('/',equipamentoController.update)

router.put('/redirect',equipamentoController.redirect)

router.delete('/:id',equipamentoController.deactivate)

router.get('/listBySmartlock/:smartlock_id',equipamentoController.listBySmartlock)





module.exports = router;