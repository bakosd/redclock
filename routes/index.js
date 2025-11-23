const express = require("express");
const clockifyController = require("../controllers/redmine.controller.js");
const validateClockifySignature = require("../middlewares/signature.middleware");
const router = express.Router();

router.post("/create", validateClockifySignature(process.env.CLOCKIFY_CREATE_WEBHOOK_SECRET), clockifyController.createTimeEntry);
router.post("/delete", validateClockifySignature(process.env.CLOCKIFY_DELETE_WEBHOOK_SECRET), clockifyController.deleteTimeEntry);
router.post("/update", validateClockifySignature(process.env.CLOCKIFY_UPDATE_WEBHOOK_SECRET), clockifyController.updateTimeEntry);

module.exports = router;