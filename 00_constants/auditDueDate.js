// expects an array of objects with auditId as a string and dueDate as dd.mm.yyyy strings
export const indexAuditDueDates = (auditDataRaw) => {
	return d3.index(auditDataRaw
		.map(d => {
				const [day, month, year] = d.dueDateAudit.split(" ")[0].split(".")
				return {
						auditId: d.auditId,
						dueDate: isNaN(year) === false ? new Date(year, month-1, day) : null
				}
		})
		.filter(d => d.dueDate !== null)
		, d => d.auditId)
}
