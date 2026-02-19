export const dateStringToDate = (dateString) => {
    const [day, month, year] = dateString.split(".").map(digit => Number(digit))
    return new Date(year, month-1, day)
}

export const yearsInTimeframe = (minDate, maxDate) => {
    const startYear = minDate.getFullYear()
    const endYear = maxDate.getFullYear()
    return Array(endYear - startYear + 1).fill(0).map((_, i) => startYear + i)
}