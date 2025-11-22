const {Duration} = require("luxon");

const formatForRedmine = (date) => {
    const d = new Date(date);
    if (isNaN(d)) throw new Error(`Invalid date passed to formatForRedmine: ${date}`);
    return d.toISOString().split("T")[0];
};

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

module.exports = {formatForRedmine, parseDuration, initTrackerRegex, parseIssueId, findUser};