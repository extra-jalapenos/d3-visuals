import { generateHolidaysForYears } from "../00_constants/holidays.js";
import { dateStringToDate, yearsInTimeframe } from "../00_constants/utils.js";
import { personAbsentOnDate } from "./absences.js";

const workschemesRaw = await d3.tsv("./data/workschemes.tsv")
export const teams = d3.union(workschemesRaw.map(d => d.Team))
export const workschemes = workschemesRaw.map(d => {
    return {
        name: d.name,
        Team: d.Team,
        Monday: parseFloat(d.Monday | 0),
        Tuesday: parseFloat(d.Tuesday | 0),
        Wednesday: parseFloat(d.Wednesday | 0),
        Thursday: parseFloat(d.Thursday | 0),
        Friday: parseFloat(d.Friday | 0),
        Saturday: parseFloat(d.Saturday | 0),
        Sunday: parseFloat(d.Sunday | 0),
        validFrom: new Date(dateStringToDate(d.validFrom).setHours(0,0,0,0)),
        validTo: !!d.validTo ?
            new Date(dateStringToDate(d.validTo).setHours(23,59,59,999))
            : null // if it's empty set to null
    }
})

export const workersWorkingOnDate = (date) => workschemes
    .filter(workscheme => workscheme.validFrom <= date && (workscheme.validTo >= date || workscheme.validTo === null))
    .filter(workscheme => personAbsentOnDate(workscheme.name, date) === false)             // remove all that are absent

const getWorkerHoursForDate = (date) => {
    const dayName = date.toLocaleDateString("en-GB", { weekday: "long" })

    const contractHours = workersWorkingOnDate(date)
        .map(worker => {
            return { date, name: worker.name, dayName, hours: worker[dayName], team: worker.Team }
        }).filter(worker => worker.hours > 0)

    return contractHours
}

export const getWorkerHoursForTimeframe = (startDate, endDate) => {
    const holidaysInTimeframe = d3.index(generateHolidaysForYears(yearsInTimeframe(startDate, endDate)), d => d)

    const days = d3.timeDay.every(1).range(startDate, endDate)
    const workerHoursOfDay = days.map(day => {
        if (holidaysInTimeframe.has(day)) {
            return []
        }
        return getWorkerHoursForDate(day)
    })

    return workerHoursOfDay.filter(dayResult => dayResult.length > 0).flat()
}