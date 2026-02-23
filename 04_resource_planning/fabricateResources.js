import { getWorkerHoursForTimeframe } from "./estimated-resources.js"
// takes a workscheme with Monday, Tuesday, etc... and generates slightly varying hours
export const fabricateWorkerHours = (fromDate, toDate, today = new Date()) => {
	const actualHours = getWorkerHoursForTimeframe(fromDate, toDate)
	// const divergingHours = d3.randomWeibull(1.1) // extreme fluctuation
	const divergingHours = d3.randomWeibull(10) // somewhat realistic fluctuations
	// in case of future dates, NO fluctuation assumed
	actualHours.forEach(entry => entry["hours"] *= entry.date <= today ? divergingHours() : 1)
	return actualHours
}
