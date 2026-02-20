import { getWorkerHoursForTimeframe } from "./estimated-resources.js"
// takes a workscheme with Monday, Tuesday, etc... and generates slightly varying hours
export const fabricateWorkerHours = (fromDate, toDate, workscheme) => {
	const actualHours = getWorkerHoursForTimeframe(fromDate, toDate)
	const divergingHours = d3.randomWeibull(10)
	actualHours.forEach(entry => entry["hours"] *= divergingHours())
	return actualHours
}
