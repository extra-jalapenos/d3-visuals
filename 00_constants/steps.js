export const loadSteps = async () => {
	const stepsRaw = await d3.tsv("/00_constants/data/steps.tsv")
	const steps = stepsRaw.map(d => {
			return {
				...d,
				id: Number(d.id),
				stageId: Number(d.stageId),
				Punkte: isNaN(d.Punkte) ? 0 : Number(d.Punkte) * 1,
				isHurdle: Boolean(d.isHurdle)
			}
		})
	return d3.index(steps, d => d.stepName)
}