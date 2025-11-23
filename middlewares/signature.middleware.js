const validateClockifySignature = (secret) => {
    return (req, res, next) => {
        const signature = req.headers["clockify-signature"];

        if (!signature) {
            return res.status(401).send("Missing Clockify signature");
        }

        if (signature !== secret) {
            return res.status(401).send("Invalid Clockify signature");
        }
        next();
    };
}

module.exports = validateClockifySignature;
