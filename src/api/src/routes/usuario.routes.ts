import usuarioController from "../controllers/usuario.controller";
import { authMiddleware, handleAdmin } from "../middlewares/auth.middleware";

const router = require('express').Router();


router.post('/',authMiddleware,handleAdmin,usuarioController.create)

router.post('/login',usuarioController.login)



router.get('/',authMiddleware,usuarioController.listAll)

router.get('/:id',authMiddleware,usuarioController.getById)

router.put('/',authMiddleware,handleAdmin,usuarioController.update)

router.delete('/:id',authMiddleware,handleAdmin,usuarioController.deactivate)

router.post('/finaliza-cadastro',usuarioController.finalizarCadastro)



module.exports = router;