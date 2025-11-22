import {findUser, formatForRedmine, parseDuration, initTrackerRegex, parseIssueId} from "../utils/helper.js";
import config from "config";

export async function fetchUsers(projectName) {
    console.log("Fetching users...");
    const res = await fetch(
        `${process.env.REDMINE_API}users.json?project_id=${projectName}`,
        {
            method: "GET",
            headers: {
                "X-Redmine-API-Key": process.env.REDMINE_API_KEY,
                "Content-Type": "application/json"
            },
        }
    );
    if (res.status !== 200) throw new Error(`Failed to fetch users: ${res.statusText}`);

    let data = await res.json();
    data = data.users.map(user => ({
        id: user.id,
        userName: `${user.firstname} ${user.lastname}`,
        userEmail: user.mail
    }));
    return data;
}

export async function fetchTrackerNames() {
    console.log("Fetching trackers...");
    const res = await fetch(`${process.env.REDMINE_API}/trackers.json`, {
        method: "GET",
        headers: {
            "X-Redmine-API-Key": process.env.REDMINE_API_KEY,
            "Content-Type": "application/json"
        }
    });
    if (res.status !== 200) throw new Error(`Failed to fetch trackers: ${res.statusText}`);

    const data = await res.json();
    return data.trackers.map(t => t.name);
}

export async function fetchActivityIds() {
    console.log("Fetching activities...");
    const res = await fetch(`${process.env.REDMINE_API}/enumerations/time_entry_activities.json`, {
        method: "GET",
        headers: {
            "X-Redmine-API-Key": process.env.REDMINE_API_KEY,
            "Content-Type": "application/json"
        }
    });
    if (res.status !== 200) throw new Error(`Failed to fetch activities: ${res.statusText}`);

    const data = await res.json();
    return Object.fromEntries(
        data.time_entry_activities.map(t => [t.name, t.id])
    );
}

export async function fetchTimeEntryBasedOnId(projectName, entryId) {
    console.log("Fetching time entry...");
    const res = await fetch(`${process.env.REDMINE_API}/time_entries.json?project_id=${projectName}`, {
        method: "GET",
        headers: {
            "X-Redmine-API-Key": process.env.REDMINE_API_KEY,
            "Content-Type": "application/json"
        }
    });
    if (res.status !== 200) throw new Error(`Failed to fetch time entry: ${res.statusText}`);
    const data = await res.json();
    for (const entry of data.time_entries) {
        if (entry.custom_fields.find(f => f.id === Number(process.env.REDMINE_TIME_ENTRY_ID_FIELD_IDENTIFIER))?.value === entryId) {
            return entry;
        }
    }
    return null;
}

function findProjectByClockifyId(clockifyId) {
    const projects = config.get("Projects");
    return projects.find(p => p.clockifyProjectId === clockifyId)?.redmineIdentifier || null;
}

export async function createTimeEntry(data) {
    const redmineProjectId = findProjectByClockifyId(data.projectId);
    if (!redmineProjectId) {
        console.log(`Project not found! Skipping...`);
        return {statusCode: 406, status: 'error', message: "Project not found"};
    }
    const users = await this.fetchUsers(redmineProjectId);
    const user = findUser(users, data.user.name, data.user.email);
    if (!user) {
        console.log(`User not found! Skipping...`);
        return {statusCode: 404, status: 'error', message: "User not found"};
    }

    if (await fetchTimeEntryBasedOnId(redmineProjectId, data.id)) {
        console.log(`Time entry already exists! Skipping...`);
        return {statusCode: 409, status: 'error', message: "Time entry already exists."}
    }

    const trackers = await this.fetchTrackerNames();
    const regex = await initTrackerRegex(trackers);
    const issueId = await parseIssueId(data.description, regex);
    if (!issueId) return {statusCode: 404, status: 'error', message: "Issue not found"};

    const activityIds = await fetchActivityIds();
    const tag = data.tags[0].name ?? '';
    const activityId = activityIds[tag];

    const timeSpent = parseDuration(data.timeInterval.duration);
    const spentOn = formatForRedmine(data.timeInterval.start);

    console.log(`Attempting to create time entry...\n- Issue: #${issueId}, Activity: ${tag} [${activityId}], User: ${user.userName} [${user.id}], Hours: ${timeSpent}, Date: ${spentOn}`);
    const res = await fetch(
        `${process.env.REDMINE_API}time_entries.json`,
        {
            method: "POST",
            headers: {
                "X-Redmine-API-Key": process.env.REDMINE_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                time_entry: {
                    user_id: user.id,
                    issue_id: issueId,
                    activity_id: activityId,
                    spent_on: spentOn,
                    hours: timeSpent,
                    comments: data.description,
                    custom_fields: [
                        {
                            id: Number(process.env.REDMINE_TIME_ENTRY_ID_FIELD_IDENTIFIER),
                            value: data.id
                        },
                        {
                            id: Number(process.env.REDMINE_TIME_ENTRY_ISSUER_FIELD_IDENTIFIER),
                            value: user.userEmail
                        }
                    ]
                }
            })
        }
    );
    console.log(`Time entry create result: ${res.statusText}`);
    if (res.status !== 201) return {
        statusCode: 500,
        status: 'error',
        message: `Failed to create time entry: ${res.statusText}`
    };
    return {
        statusCode: 201,
        status: 'success',
        message: `Time entry created successfully!`
    };
}