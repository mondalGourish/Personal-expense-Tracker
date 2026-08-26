const express = require("express");
const { homeController, postController } = require("../controllers/test.controller");

const router = express.Router();

router.get("/", homeController);

router.post("/test",postController)

module.exports = router;
