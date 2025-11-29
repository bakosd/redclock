async function fetchClockifyReport(startDate, endDate) {
    const payload = {
        dateRangeStart: startDate,
        dateRangeEnd: endDate,
        detailedFilter: {
            sortColumn: "USER",
            options: {
                totals: "EXCLUDE"
            }
        },
        exportType: "JSON"
    };
    console.log(`Fetching Clockify report for ${startDate} - ${endDate}..`)

    const res = await fetch(
        `${process.env.CLOCKIFY_API}workspaces/${process.env.CLOCKIFY_WORKSPACE}/reports/detailed`,
        {
            method: "POST",
            headers: {
                "X-Api-Key": process.env.CLOCKIFY_API_KEY,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        }
    );

    const data = await res.json();
    if (!data.timeentries) {
        console.error("No data returned from Clockify API");
        return []
    }
    console.log(`Fetched ${data.timeentries.length ?? 0} entries.`);

    return data.timeentries;
}


async function fetchUserDataFromReports(startDate, endDate) {
    const reports = await fetchClockifyReport(startDate, endDate);
    let users = [];
    reports?.forEach(report => {
        if (!users.find(u => u.userId === report.userId)) {
            users.push({userId: report.userId, userName: report.userName, userEmail: report.userEmail, reports: [report]})
        } else {
            users.find(u => u.userId === report.userId).reports.push(report);
        }
    })
    return users;
}

export {fetchClockifyReport, fetchUserDataFromReports}