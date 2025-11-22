const express = require("express");
const clockifyController = require("../controllers/redmine.controller.js");
const router = express.Router();

router.get("/create", clockifyController.createTimeEntry);

module.exports = router;