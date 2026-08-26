const express = require("express");
const aboutController = require("../controllers/about.controller");

const router = express.Router();

router.get("/", aboutController);

module.exports = router;
