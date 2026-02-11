export const calculateStatusProgression = async (worklogDataRaw, auditDueDateDataRaw) => {
    const stepsRaw = await d3.tsv("./steps.tsv")
    const steps = d3.index(stepsRaw.map(d => {
        return { ...d, id: Number(d.id), stageId: Number(d.stageId), Punkte: parseFloat(d.Punkte) }
    }), d => d.stepName)

    // because my data is so old i'm gonna pretend that "TODAY" is the 10th of Feb 2023
    // replace with new Date() for true today
    const today = new Date(2023, 1, 10) // actually today: const today = new Date()

    const auditDueDates = d3.index(auditDueDateDataRaw.map(d => {
            const [day, month, year] = d.dueDateAudit.split(" ")[0].split(".")
            return {
                auditId: d.auditId,
                dueDate: isNaN(year) === false ? new Date(year, month-1, day) : null
            }
        })
        .filter(d => d.dueDate !== null)
        , d => d.auditId)

    const worklogData = worklogDataRaw
        .map(d => {
            const [day, month, year] = d.doneAt.split(" ")[0].split(".")
            return {
                ...d,
                workstep: steps.get(d.workstep),
                doneAt: isNaN(year) === false ? new Date(year, month-1, day) : null
            }
        })

    // function to calculate a status progression out of a worklog array
    const processLogs = (worklogArray, dueDate = null) => {
        // we sort by workstep id first and then by date
        // so should e.g. step 2 and 3 be done on the same date, we assume they were done in logical order
        const sorted = worklogArray
            .filter(d => d.doneAt !== null && d.doneAt <= today) // get rid of all steps with unknown doneAt date
            .sort((a, b) => a.workstep.id - b.workstep.id)
            .sort((a, b) => a.doneAt - b.doneAt)

        if (sorted.length === 0) return []

        // make a map of the earliest occurences of all listed steps
        const worklogMap = new d3.rollup(sorted,
            D => d3.min(D.map(d => d.doneAt)),
            d => d.workstep.stepName
        )

        // define hurdles == hurdles are steps after which the status will not be moved back
        // so e.g. even when there is an instance of "NB I" done after "Fertigstellung", it will have no effect on the status progression
        // this emulates the status calculation in the application itself
        // at least if I remember correctly
        const hurdleStepNames = [
            "Tourenplanung", "VB II", "Termin", "NB I", "Fertigstellung", "Prüfung", "Freigabe", "Versand", "Rechnung", "Zahlung"
        ]

        const hurdleWorklogs = sorted.filter(worklog => hurdleStepNames.includes(worklog.workstep.stepName))

        // loop through and increase date if below previous
        let previousDate = null
        let cleanedInconsistentTimeline = false
        const timeline = new d3.InternMap(hurdleStepNames.filter(hurdleStepName => worklogMap.has(hurdleStepName)) // relevantHurdles in order
            .map(hurdleStepName => {
                if (worklogMap.get(hurdleStepName) > previousDate) {
                    previousDate = worklogMap.get(hurdleStepName)
                } else if (worklogMap.get(hurdleStepName) < previousDate) {
                    cleanedInconsistentTimeline = true
                }
                return [hurdleStepName, previousDate]
            }))

        // everything else is just contacting the client
        const contactWorklogs = sorted.filter(worklog => hurdleStepNames.includes(worklog.workstep.stepName) === false)

        // get VB Is: before Tourenplanung
        const VBIMatches = contactWorklogs.filter(worklog => worklog.doneAt <= worklogMap.get("Tourenplanung"))
        if (VBIMatches.length) {
            timeline.set("VB I", d3.min(VBIMatches, d => d.doneAt))
        }

        // VB I done between set audit date and audit counts as VB II
        const VBIIMatches = contactWorklogs.filter(worklog => worklog.date >= worklogMap.get("Tourenplanung") &&  worklog.date <= worklogMap.get("Termin"))
        if (VBIIMatches.length) {
            const earliestMatch = d3.min(VBIIMatches, d => d.doneAt)
            if (worklogMap.has("VB II")) {
                timeline.set("VB II", d3.min([worklogMap.get("VB II"), earliestMatch]))
            } else {
                timeline.set("VB II", earliestMatch)
            }
        }

        const NBIIMatches = contactWorklogs.filter(worklog => worklog.date >= worklogMap.get("NB I") && worklog.date <= worklogMap.get("Fertigstellung"))
        if (NBIIMatches.length) {
            timeline.set("NB II", d3.min(NBIIMatches, d => d.date))
        }

        // we're not sorting anything. we're frankensteining this together
        const finalArray = [
            "VB I", "Tourenplanung", "VB II", "Termin", "NB I", "NB II",
						"Fertigstellung", "Prüfung", "Freigabe", "Versand", "Rechnung", "Zahlung"
        ].map(stepName => [stepName, timeline.get(stepName)])
        .filter(stepAndDateTuple => !!stepAndDateTuple[1])

        let from = "Beginn"
        const statusProgression = finalArray.map(worklog => {
            const [stepName, doneAt] = worklog
            const returnObj = { from, to: stepName, date: doneAt }
            from = stepName
            return returnObj
        })

        statusProgression.forEach((worklog, index) => {
            if (index !== finalArray.length - 1) {
                const daysTillNextStatus = Math.round((statusProgression[index+1].date - worklog.date) / (1000 * 24 * 60 * 60));
                worklog["daysTillNextStatus"] = daysTillNextStatus;
								if (dueDate) {
									const daysTillDueDate = Math.round((dueDate - worklog.date) / (1000 * 24 * 60 * 60));
									worklog["daysTillDueDate"] = daysTillDueDate;
								}
            }
        })

        const completeProgression = finalArray.length === 14
        return { statusProgression, completeProgression, worklogArray: finalArray, cleanedInconsistentTimeline, currentStatus: statusProgression[statusProgression.length - 1]?.to }
    }

    const groupedByAuditId = d3.rollup(worklogData, D => processLogs(D), d => d.auditId)
	return groupedByAuditId
}
