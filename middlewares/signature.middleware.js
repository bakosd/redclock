const validateClockifySignature = (secretName) => {
    return (req, res, next) => {
        const secret = process.env[secretName];
        if (!secret) {
            return res.status(500).send("Undefined Clockify secret at server side. If you are the administrator, please check the .env file.");
        }
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

export {validateClockifySignature};
