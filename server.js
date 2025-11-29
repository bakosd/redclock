import dotenv from "dotenv";
dotenv.config();

import express from "express";
import router from "./routes/index.js";
import nodemailer from "nodemailer";

const app = express();

app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.use("/clockify-webhook", router);


export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        servername: process.env.SMTP_SERVER
    }
});


const port = process.env.PORT || 3003;

(async () => {
    try {
        app.listen(port, () => console.log(`Backend listening on port '${port}'!\nBackend is running in '${process.env.NODE_ENV}' mode!`));
    } catch (err) {
        console.error('Backend failed to start!', err);
    }
})();

