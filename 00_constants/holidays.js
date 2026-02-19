const fixedHolidays = (year) => {
	return [
			new Date(year, 0, 1), // Neujahr
			new Date(year, 0, 6), // Hl. 3 Könige
			new Date(year, 4, 1), // Tag der Arbeit
			new Date(year, 7, 15), // Mariä Himmelfahrt
			new Date(year, 9, 3), // Tag der dt. Einheit
			new Date(year, 10, 1), // Allerheiligen
			new Date(year, 11, 25), // 1. Weihnachtsfeiertag
			new Date(year, 11, 26), // 2. Weihnachtsfeiertag
	]
}

const movingHolidays = (year) => {
	const f = Math.floor
	// Golden Number - 1
	const G = year % 19
	const C = f(year / 100)
	// related to Epact
	const H = (C - f(C / 4) - f((8 * C + 13)/25) + 19 * G + 15) % 30
	// number of days from 21 March to the Paschal full moon
	const I = H - f(H/28) * (1 - f(29/(H + 1)) * f((21-G)/11))
	// weekday for the Paschal full moon
	const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7
	// number of days from 21 March to the Sunday on or before the Paschal full moon
	const L = I - J
	const month = 3 + f((L + 40)/44)
	const day = L + 28 - 31 * f(month / 4);
	return [
						// new Date(year, month-1, day - 3), // Gründonnerstag
						new Date(year, month-1, day - 2), // Karfreitag
						new Date(year, month-1, day), // Ostersonntag
						new Date(year, month-1, day + 1), // Ostermontag
						new Date(year, month-1, day + 39), // Christi Himmelfahrt
						new Date(year, month-1, day + 49), // Pfingstsonntag
						new Date(year, month-1, day + 50), // Pfingstmontag
						new Date(year, month-1, day + 60) // Fronleichnam
				]
}

export const generateHolidaysForYears = (yearArr = [new Date().getFullYear()]) => {
		const fixedHolidaysResult = yearArr.map(year => fixedHolidays(year))
		const movingHolidaysResult = yearArr.map(year => movingHolidays(year))
		return [...fixedHolidaysResult.flat(), ...movingHolidaysResult.flat()]
}
