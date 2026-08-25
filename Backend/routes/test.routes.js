const express = require('express')
const homeController = require('../controllers/test.controller')

const router = express.Router()

router.get('/',homeController)

module.exports =  router