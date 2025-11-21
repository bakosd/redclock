import { writeFile, readFile, mkdir } from "fs/promises";
import { dirname } from "path";

export const saveLastExecution = async (date = new Date()) => {
    const filePath = process.env.EXECUTION_DATE_PATH;
    try {
        await mkdir(dirname(filePath), { recursive: true });

        await writeFile(filePath, date.toISOString(), "utf-8");
    } catch (err) {
        console.error("Failed to save last execution:", err);
        throw err;
    }
}

export const readLastExecution = async () => {
    const filePath = process.env.EXECUTION_DATE_PATH;
    try {
        const text = await readFile(filePath, "utf-8");
        return new Date(text).toISOString();
    } catch (err) {
        if (err.code === "ENOENT") return null;
        console.error("Failed to read last execution:", err);
        throw err;
    }
}

export const getDate = (startOfDay = false) => {
    let now = new Date();
    if (startOfDay) {
        now = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
    }
    return now.toISOString();
};

export const formatForRedmine = (date) => {
    const d = new Date(date);
    if (isNaN(d)) throw new Error(`Invalid date passed to formatForRedmine: ${date}`);
    return d.toISOString().split("T")[0];
};

export const initTrackerRegex = async (trackers) => {
    const escaped = trackers
        .map(t => t.trim())
        .map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    return new RegExp(`(${escaped.join("|")})\\s*#(\\d+)`, "i");
}


export const parseIssueId = (description, regex) => {
    if (!regex) throw new Error("Tracker regex not initialized");
    const match = description.match(regex);
    return match ? parseInt(match[2], 10) : null;
};

export const findUser = (users, userName, userEmail) => users.find(u => (u.userName === userName || u.userEmail === userEmail));