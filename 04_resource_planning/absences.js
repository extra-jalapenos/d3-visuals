import { dateStringToDate } from "/00_constants/utils.js"

const absencesRaw = await d3.tsv("./data/absences.tsv")
const absences = absencesRaw.map(absence => {
    return {
        ...absence,
        from: dateStringToDate(absence.from),
        to: dateStringToDate(absence.to),
    }
})
const absencesPerPerson = d3.group(absences, d => d.name)

export const personAbsentOnDate = (name, date) => {
    if (!date) throw Error("invalid date")
    if (absencesPerPerson.has(name) === false) return false
    return absencesPerPerson.get(name).filter(absence => absence.from <= date && absence.to >= date).length > 0
}