console.log("d3", d3)

// because my data is so old i'm gonna pretend that "TODAY" is the 10th of Feb 2023
export const pastAuditWorklogAnalysis = async (today = new Date()) => {
	const worklogDataRaw = await d3.tsv("../02_audit_duedates/worklogs.txt")
    const auditDataRaw = await d3.tsv("../02_audit_duedates/audits.txt")
    const steps = await loadSteps()

    const auditDueDates = indexAuditDueDates(auditDataRaw.filter(d => d.auditId.includes("eeg2009")))

    const worklogData = cleanWorklogData(worklogDataRaw.map(d => {
        return {
            ...d,
            workstep: steps.get(d.workstep)
        }
    }))

    const groupedByAuditId = d3.rollup(worklogData, D => processLogs(D, today), d => d.auditId)

    // we want to limit the reference data to elements with last status being at least "Rechnung"
    const relevantEntries = Array.from(groupedByAuditId.entries()).filter(([key, value]) => {
        const hasDueDate = auditDueDates.has(key)
        if (!hasDueDate) return false
        if (["Rechnung", "Zahlung"].includes(value.currentStatus) === false) return false
        // let's filter for reference year >= 2020, too
        const referenceYear = Number(key.split("_")[0])
        if (referenceYear < 2020) return false
        return true
    })
		.map(D => {
				const [auditId, dataObj] = D
				const referenceYear = Number(auditId.split("_")[0])
				const auditType = auditId.split("_")[3]
				const dueDate = auditDueDates.get(auditId).dueDate
				dataObj.statusProgression.forEach(status => {
						const daysTillDueDate = Math.round((dueDate - status.date) / (1000 * 60 * 60 * 24))
						status["daysTillDueDate"] = daysTillDueDate
				})
				return { ...dataObj, referenceYear, auditType, dueDate }
		}) // add in audit type key and due date

	return d3.group(relevantEntries, d => d.auditType)
}

export const renderPastAuditWorklogAnalsysis = () => {

	// replace with new Date() for true today
	const today = new Date(2023, 1, 10) // actually today: const today = new Date()
	const itemsPerAuditType = pastAuditWorklogAnalysis(today)
	// the canvas is clientSizing - margins
	const margin = { top: 20, left: 40, bottom: 30, right: 30}
	const plotHeight = clientHeight / 2 - margin.bottom - margin.top
	const plotWidth = clientWidth - margin.left - margin.right
	// visualize the relationship between "daysTillDueDate" and "daysTillNextStatus", and what the next status is
	const svgs = d3.select("body").selectAll("svg.distribution")
			.data(itemsPerAuditType)
			.enter()
			.append("svg")
			.attr("class", "distribution")
			.attr("id", d => d[0])
			.attr("width", clientWidth)
			.attr("height", plotHeight)


	svgs.each(function (datum) {
			const [key, value] = datum
			const currentSVG = d3.select(this)

			const canvas = currentSVG
					.append("g")
					.attr("class", "canvas")
					.attr("transform", `translate(${margin.left}, ${margin.top})`)

			const axes = currentSVG
					.append("g")
					.attr("class", "axes")

			const condensedValues = value.map(d => d.statusProgression).flat()
			const extentYAxis = d3.extent(condensedValues, d => d.daysTillDueDate)
			const extentXAxis = d3.extent(condensedValues, d => d.daysTillNextStatus)

			const xScale = d3.scaleLinear().domain([-100, 400]).range([0, clientWidth - margin.left - margin.right])
			const yScale = d3.scaleLinear().domain([-100, 300]).range([plotHeight, 0])
			xScale.clamp(true)
			yScale.clamp(true)

			const xAxis = axes
					.append("g")
					.attr("class", "x axis")
					.attr("transform", `translate(${margin.left}, ${yScale(0) + margin.top})`)
					.call(d3.axisBottom(xScale))

			const yAxis = axes
					.append("g")
					.attr("class", "y axis")
					.attr("transform",  `translate(${margin.left + xScale(0)}, ${margin.top})`)
					.call(d3.axisLeft(yScale))

			const textXAxis = xAxis
					.append("text")
					.text("Days until next step")
					.attr("class", "axis-title")
					.attr("transform",  `translate(${plotWidth / 2}, ${margin.bottom - 5})`)

			const textYAxis = yAxis
					.append("text")
					.text("Days until due date of audit")
					.attr("class", "axis-title")
					.attr("transform",  `translate(${-40}, ${(plotHeight / 2)}) rotate(-90)`)

			const colorForSteps = d3.scaleSequential(d3.interpolateRdYlGn).domain([0, steps.size-1])
			const groupByStepFrom = d3.rollup(condensedValues, D => D, d => d.from)

			const rectGroups = canvas
					.selectAll("g")
					.data(groupByStepFrom)
					.enter()
					.append("g")
					.attr("class", d => d[0])
					.attr("fill", d => colorForSteps(steps.get(d[0]).id))

			const circles = rectGroups.selectAll("circle")
					.data(d => d3.flatRollup(d[1], D => D.length, d => d.daysTillNextStatus, d => d.daysTillDueDate))
					.enter()
					.append("circle")
					.attr("r", 2)
					.attr("cx", d => xScale(d[0]))
					.attr("cy", d => yScale(d[1]))
	})
}
