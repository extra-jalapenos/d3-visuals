// we have to have the option to pretend that today is another day because my data is old
import { cleanWorklogData } from "../00_constants/worklog.js";
import { loadSteps } from "../00_constants/steps.js";

export const getPointsByDate = async (startDate, endDate, today = new Date()) => {
    const worklogDataRaw = await d3.tsv("/00_constants/data/worklogs.txt")
    const worklogData = cleanWorklogData(worklogDataRaw)
    const worklogDataFiltered = worklogData.filter(
        data => !!data.doneAt
            && data.doneAt <= today
            && data.doneAt >= startDate
            && data.doneAt <= endDate
    )
    const steps = await loadSteps()
    // sum by date
    const byDateAndStep = d3.rollup(worklogDataFiltered, D => d3.sum(D.map(d => steps.get(d.workstep).Punkte)), d => d.doneAt)
    return byDateAndStep
}