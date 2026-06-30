import usuarioController from "../controllers/usuario.controller";

const router = require('express').Router();


router.post('/',usuarioController.create)

router.post('/login',usuarioController.login)

router.get('/:mac',usuarioController.getUsuariosAutorizados)




module.exports = router;