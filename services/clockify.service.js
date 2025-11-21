import {getDate, readLastExecution} from "../utils/helper.js";

export async function fetchClockifyReport() {
    const start = await readLastExecution() ?? getDate(true)
    const end = getDate();
    const payload = {
        dateRangeStart: start,
        dateRangeEnd: end,
        detailedFilter: {
            sortColumn: "USER"
        },
        exportType: "JSON"
    };
    console.log(`Fetching Clockify report for ${start} - ${end}..`)

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
