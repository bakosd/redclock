import dotenv from "dotenv";
import config from "config";
import {fetchClockifyReport} from "./services/clockify.service.js";
import {createTimeEntry, fetchActivityIds, fetchTrackerNames, fetchUsers} from "./services/redmine.service.js";
import {findUser, formatForRedmine, initTrackerRegex, parseIssueId, saveLastExecution} from "./utils/helper.js";

dotenv.config();

const reports = await fetchClockifyReport();
if (!reports.length) {
    console.log("No reports to process.");
    process.exit(0);
}

const projects = config.get("Projects");
const trackers = await fetchTrackerNames();
const regex = await initTrackerRegex(trackers);
const activityIds = await fetchActivityIds();


for (const project of projects) {
    console.log(`-----------------------------------\nProcessing ${project.redmineIdentifier} project...`)
    const users = await fetchUsers(project.redmineIdentifier);
    for (const report of reports) {
        if (report.projectId !== project.clockifyProjectId) continue;
        const user = findUser(users, report.userName, report.userEmail);
        if (!user) {
            console.error('User not found:', report.userName, report.userEmail);
            // TODO: need to save the entries which can not be assigned to any user!
        }
        const issueId = await parseIssueId(report.description, regex);
        const tag = report.tags[0].name ?? '';
        const activityId = activityIds[tag];
        const hours = report.timeInterval.duration / 3600;
        const spentOn = formatForRedmine(report.timeInterval.start);
        console.log(`Processing time entry...\n- Issue: #${issueId}, Activity: ${tag} [${activityId}], User: ${user.userName} [${user.id}], Hours: ${hours}, Date: ${spentOn}`);
        const result = await createTimeEntry(
            user.id,
            issueId,
            activityId,
            spentOn,
            hours,
            report.description,
            report._id,
            report.userEmail
        );
        if (!result) continue;
        console.log(`Created time entry '${report.description}' for ${user.userName}`);
        await saveLastExecution();
    }
}