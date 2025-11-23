import {findUser, formatForRedmine, initTrackerRegex, parseDuration, parseIssueId} from "../utils/helper.js";
import config from "config";

async function fetchUsers(projectName) {
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
    if (res.status !== 200) return null;

    let data = await res.json();
    data = data.users.map(user => ({
        id: user.id,
        userName: `${user.firstname} ${user.lastname}`,
        userEmail: user.mail
    }));
    return data;
}

async function fetchTrackerNames() {
    console.log("Fetching trackers...");
    const res = await fetch(`${process.env.REDMINE_API}/trackers.json`, {
        method: "GET",
        headers: {
            "X-Redmine-API-Key": process.env.REDMINE_API_KEY,
            "Content-Type": "application/json"
        }
    });
    if (res.status !== 200) return null;

    const data = await res.json();
    return data.trackers.map(t => t.name);
}

async function fetchActivityIds() {
    console.log("Fetching activities...");
    const res = await fetch(`${process.env.REDMINE_API}/enumerations/time_entry_activities.json`, {
        method: "GET",
        headers: {
            "X-Redmine-API-Key": process.env.REDMINE_API_KEY,
            "Content-Type": "application/json"
        }
    });
    if (res.status !== 200) return null;

    const data = await res.json();
    return Object.fromEntries(
        data.time_entry_activities.map(t => [t.name, t.id])
    );
}

async function fetchTimeEntryBasedOnId(projectName, entryId) {
    console.log("Fetching time entry...");
    const res = await fetch(`${process.env.REDMINE_API}/time_entries.json?project_id=${projectName}`, {
        method: "GET",
        headers: {
            "X-Redmine-API-Key": process.env.REDMINE_API_KEY,
            "Content-Type": "application/json"
        }
    });
    if (res.status !== 200) return null;
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

async function searchForTimeEntry({projectId, userName, userEmail, entryId}) {
    const redmineProject = findProjectByClockifyId(projectId);
    let user = null;
    let timeEntry = null;

    if (!redmineProject) {
        return {redmineProject, user, timeEntry};
    }

    const users = await fetchUsers(redmineProject);
    user = findUser(users, userName, userEmail);
    if (!user) {
        return {redmineProject, user, timeEntry};
    }

    timeEntry = await fetchTimeEntryBasedOnId(redmineProject, entryId);
    return {redmineProject, user, timeEntry, users};
}

async function searchIssue(comment) {
    const trackers = await fetchTrackerNames();
    const regex = await initTrackerRegex(trackers);
    return parseIssueId(comment, regex);
}

export async function createTimeEntry(data) {
    console.log(`--------------------------------\nCREATE: Attempting to create time entry...\n`);
    const timeEntry = await searchForTimeEntry({
        projectId: data.projectId,
        userName: data.user.name,
        userEmail: data.user.email,
        entryId: data.id
    });
    if (!timeEntry.redmineProject) {
        console.log(`Project not found! Skipping...`);
        return {statusCode: 406, status: 'error', message: "Project not found"};
    }

    if (!timeEntry.user) {
        console.log(`User not found! Skipping...`);
        return {statusCode: 404, status: 'error', message: "User not found"};
    }

    if (timeEntry.timeEntry) {
        console.log(`Time entry already exists! Skipping...`);
        return {statusCode: 409, status: 'error', message: "Time entry already exists."}
    }

    const issueId = await searchIssue(data.description);
    if (!issueId) return {statusCode: 404, status: 'error', message: "Issue not found"};

    const activityIds = await fetchActivityIds();
    const tag = data.tags[0].name ?? '';
    const activityId = activityIds[tag];

    const timeSpent = parseDuration(data.timeInterval.duration);
    const spentOn = formatForRedmine(data.timeInterval.start);

    console.log(`Attempting to create time entry...\n- Issue: #${issueId}, Activity: ${tag} [${activityId}], User: ${timeEntry.user.userName} [${timeEntry.user.id}], Hours: ${timeSpent}, Date: ${spentOn}`);
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
                    user_id: timeEntry.user.id,
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
                            value: `${data.user.name} (${data.user.id})`
                        }
                    ]
                }
            })
        }
    );
    console.log(`Time entry create result: ${res.statusText}`);
    console.log(`\n--------------------------------`);
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

export async function deleteTimeEntry(data) {
    console.log(`--------------------------------\nDELETE: Attempting to delete time entry...\n`);
    const timeEntry = await searchForTimeEntry({
        projectId: data.projectId,
        userName: data.user.name,
        userEmail: data.user.email,
        entryId: data.id
    });

    if (!timeEntry.timeEntry) {
        console.log(`Time entry does not exists! Skipping...`);
        return {statusCode: 404, status: 'error', message: "Time entry does not exists."}
    }
    console.log(`Attempting to delete time entry...\n- Issue: #${timeEntry.timeEntry.id}, User: ${timeEntry.timeEntry.user.userName} [${timeEntry.timeEntry.user.id}]`)
    const res = await fetch(`${process.env.REDMINE_API}/time_entries/${timeEntry.timeEntry.id}.json`, {
        method: "DELETE",
        headers: {
            "X-Redmine-API-Key": process.env.REDMINE_API_KEY,
            "Content-Type": "application/json"
        }
    });
    console.log(`Time entry delete result: ${res.status === 204 ? 'OK' : res.statusText}`);
    console.log(`\n--------------------------------`);
    return {
        statusCode: res.status,
        status: res.status === 204 ? 'success' : 'error',
        message: res.status === 204 ? `Time entry deleted successfully!` : `Failed to delete time entry: ${res.statusText}`
    };
}

export async function updateTimeEntry(data) {
    console.log(`--------------------------------\nUPDATE: Attempting to update time entry...\n`);
    const timeEntry = await searchForTimeEntry({
        projectId: data.projectId,
        userName: data.user.name,
        userEmail: data.user.email,
        entryId: data.id
    });
    if (!timeEntry.timeEntry) {
        console.log(`Time entry does not exists! Skipping...`);
        return {statusCode: 404, status: 'error', message: "Time entry does not exists."}
    }

    const issueId = await searchIssue(data.description);
    if (!issueId) {
        console.log(`Time entry does not exist (edited time entry)! Skipping...`);
        return {statusCode: 404, status: 'error', message: "Issue not found"};
    }

    const activityIds = await fetchActivityIds();
    const tag = data.tags[0].name ?? '';
    const activityId = activityIds[tag];
    const spentOn = formatForRedmine(data.timeInterval.start);
    const hours = parseDuration(data.timeInterval.duration);

    const time_entry = {
        ...timeEntry.timeEntry,
        comments: data.description,
        spent_on: spentOn,
        hours,
        issue_id: issueId,
        activity_id: activityId
    }
    console.log(`Attempting to update time entry...\n- Issue: #${issueId}, Activity: ${tag} [${activityId}], User: ${timeEntry.timeEntry.user.name} [${timeEntry.timeEntry.user.id}], Hours: ${hours}, Date: ${spentOn}`);
    const res = await fetch(
        `${process.env.REDMINE_API}time_entries/${timeEntry.timeEntry.id}.json`,
        {
            method: "PUT",
            headers: {
                "X-Redmine-API-Key": process.env.REDMINE_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                time_entry: time_entry
            })
        }
    );

    console.log(`Time entry update result: ${res.status === 204 ? 'OK' : res.statusText}`);
    console.log(`\n--------------------------------`);
    return {
        statusCode: res.status,
        status: res.status === 204 ? 'success' : 'error',
        message: res.status === 204 ? `Time entry was updated successfully!` : `Failed to update time entry: ${res.statusText}`
    };
}