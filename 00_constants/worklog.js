// cleans date "doneAt" formats in the form of dd.mm.yyyy
export const cleanWorklogData = (worklogDataRaw) => worklogDataRaw
	.map(d => {
			const [day, month, year] = d.doneAt.split(" ")[0].split(".")
			return {
					...d,
					doneAt: isNaN(year) === false ? new Date(year, month-1, day) : null
			}
	})
