import usuarioController from "../controllers/usuario.controller";

const router = require('express').Router();


router.post('/',usuarioController.create)

router.post('/login',usuarioController.login)

router.get('/',usuarioController.listAll)

router.get('/:id',usuarioController.getById)

router.put('/',usuarioController.update)

router.delete('/:id',usuarioController.deactivate)

router.post('/finaliza-cadastro',usuarioController.finalizarCadastro)



module.exports = router;