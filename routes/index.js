import express from "express";
import * as clockifyController from "../controllers/redmine.controller.js";
import {validateClockifySignature} from "../middlewares/signature.middleware.js";

const router = express.Router();

router.post(
    "/create",
    validateClockifySignature('CLOCKIFY_CREATE_WEBHOOK_SECRET'),
    clockifyController.createTimeEntry
);

router.post(
    "/delete",
    validateClockifySignature('CLOCKIFY_DELETE_WEBHOOK_SECRET'),
    clockifyController.deleteTimeEntry
);

router.post(
    "/update",
    validateClockifySignature('CLOCKIFY_UPDATE_WEBHOOK_SECRET'),
    clockifyController.updateTimeEntry
);

export default router;