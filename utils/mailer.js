import mjml from "mjml";
import handlebars from "handlebars";
import fs from "fs";
import path from "path";
import {fileURLToPath} from "url";
import {transporter} from "../server.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mjml2html = mjml.default || mjml;

function resolveHandlebars(obj, context) {
    if (typeof obj === "string") {
        if (obj.includes("{{")) {
            return handlebars.compile(obj)(context);
        }
        return obj;
    } else if (Array.isArray(obj)) {
        return obj.map(item => resolveHandlebars(item, context));
    } else if (typeof obj === "object" && obj !== null) {
        const result = {};
        for (const key in obj) {
            result[key] = resolveHandlebars(obj[key], context);
        }
        return result;
    } else {
        return obj;
    }
}

async function sendEmail(template, to, subject, data = {}) {
    template = path.join(__dirname, "..", "assets", "templates", template);
    if (!template || !to || !subject) {
        console.error("Invalid email parameters!");
        return;
    }
    try {
        console.log(`Preparing email for ${to}...`);
        const mjmlTemplateSource = fs.readFileSync(template, "utf8");
        const dynamicTemplate = handlebars.compile(mjmlTemplateSource);

        data = {...data, appName: process.env.APP_NAME};
        const resolvedData = resolveHandlebars(data, data);

        const htmlOutput = mjml2html(dynamicTemplate(resolvedData)).html;
        const logoPath = path.join(__dirname, "..", "assets", "redclock.png");

        console.log(`Sending email to ${to}...`);
        await transporter.sendMail({
            from: `"${process.env.APP_NAME}" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html: htmlOutput,
            attachments: [
                {
                    filename: "logo.png",
                    path: logoPath,
                    cid: "logo"
                }
            ]
        });
    } catch (err) {
        console.error("Failed to send email!", err);
    }
}

export {sendEmail};