const express = require('express');
const app = express();
const router = require("./routes");

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.use("/clockify-webhook", router);

module.exports = app;
