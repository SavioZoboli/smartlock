import unidadeController from "../controllers/unidade.controller"

const router = require('express').Router()


router.post('/',unidadeController.create)

router.get('/',unidadeController.listAll)

router.get('/:id',unidadeController.getById)

router.put('/',unidadeController.update)

router.delete('/:id',unidadeController.delete)


module.exports = router