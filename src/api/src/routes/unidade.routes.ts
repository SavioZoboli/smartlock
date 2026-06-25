import unidadeController from "../controllers/unidade.controller"

const router = require('express').Router()


router.post('/',unidadeController.create)


module.exports = router