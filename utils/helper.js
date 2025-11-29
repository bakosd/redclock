import {Duration, DateTime} from "luxon";

const getDateISO = (offset) => {
    let now = DateTime.now().setZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    if (offset) {
        if (offset < 0) {
            now = now.minus({minutes: -offset})
        } else {
            now = now.plus({minutes: offset})
        }
    }
    return now.toUTC()
        .plus({minutes: now.offset})
        .toISO({suppressMilliseconds: false});
};

const formatForRedmine = (date) => {
    const d = new Date(date);
    if (isNaN(d)) throw new Error(`Invalid date passed to formatForRedmine: ${date}`);
    return d.toISOString().split("T")[0];
};
const formatForClockify = (date) => DateTime.fromISO(date).plus({minutes: 60}).toUTC().toISO();
const formatForEmail = (date) => DateTime.fromISO(date).toFormat(process.env.EMAIL_DATE_FORMAT ?? "dd.MM.yyyy HH:mm:ss");

function parseDuration(isoDuration) {
    if (!isoDuration) return 0;
    const dur = Duration.fromISO(isoDuration);
    return Number(dur.as("hours").toFixed(2));
}

const initTrackerRegex = async (trackers) => {
    const escaped = trackers
        .map(t => t.trim())
        .map(t => t.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
    return new RegExp(`(${escaped.join("|")})\\s*#(\\d+)`, "i");
}


const parseIssueId = (description, regex) => {
    if (!regex) throw new Error("Tracker regex not initialized");
    const match = description.match(regex);
    return match ? parseInt(match[2], 10) : null;
};

const findUser = (users, userName, userEmail) =>
    users.find(u => (u.userName === userName || u.userEmail === userEmail));

export {formatForRedmine, formatForClockify, formatForEmail, parseDuration, initTrackerRegex, parseIssueId, findUser, getDateISO};