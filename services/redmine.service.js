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

export async function createTimeEntry(userId, issueId, activityId, spentOn, timeSpent, description) {
    console.log("Creating time entry...");
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
                    user_id: userId,
                    issue_id: issueId,
                    activity_id: activityId,
                    spent_on: spentOn,
                    hours: timeSpent,
                    comments: description
                }
            })
        }
    );
    if (res.status !== 201) throw new Error(`Failed to create time entry: ${res.statusText}`);
    const data = await res.json();
    console.log(data);
    return res.status === 201;
}