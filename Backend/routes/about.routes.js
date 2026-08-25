const express = require('express')
const aboutController = require('../controllers/about.controller')

const router = express.Router()

router.get('/about',aboutController)

module.exports = router