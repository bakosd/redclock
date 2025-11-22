const express = require("express");
const clockifyController = require("../controllers/redmine.controller.js");
const validateClockifySignature = require("../middlewares/signature.middleware");
const router = express.Router();

router.post("/create", validateClockifySignature(process.env.CLOCKIFY_CREATE_WEBHOOK_SECRET), clockifyController.createTimeEntry);

module.exports = router;