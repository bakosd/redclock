const crypto = require("crypto");

const validateClockifySignature = (secret) => {
    return (req, res, next) => {
        const signature = req.headers["clockify-signature"];

        if (!signature) {
            return res.status(401).send("Missing Clockify signature");
        }

        if (!req.rawBody) {
            return res.status(400).send("Raw body missing");
        }

        const hmac = crypto.createHmac("sha256", secret);
        hmac.update(req.rawBody);
        const digest = hmac.digest("hex");

        try {
            const valid = crypto.timingSafeEqual(
                Buffer.from(digest, "utf8"),
                Buffer.from(signature, "utf8")
            );

            if (!valid) {
                return res.status(401).send("Invalid Clockify signature");
            }

            return next();

        } catch (err) {
            return res.status(401).send("Invalid Clockify signature");
        }
    };
}

module.exports = validateClockifySignature;
