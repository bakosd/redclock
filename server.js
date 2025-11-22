const express = require("express");
const app = express();
require("dotenv").config();

const router = require("./routes");

app.use(express.json());

app.use("/clockify-webhook", router);

const port = process.env.PORT || 3003;

(async () => {
    try {
        app.listen(port, () => console.log(`Backend listening on port '${port}'!\nBackend is running in '${process.env.NODE_ENV}' mode!`));
    } catch (err) {
        console.error('Backend failed to start!', err);
    }
})();

