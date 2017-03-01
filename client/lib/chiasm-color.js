const colors = [
	'#018d5d',
	'#ba4460',
	'#9ea946',
	'#00479f',
	'#c26939',
	'#8188df',
	'#ee6bd4'
]
const chiasmColors = {
	a: 0,
	b: 1,
	c: 2,
	d: 3,
	e: 4,
	f: 5,
	g: 6,
	h: 7
}

module.exports = function getChiasmColor(identifier) {
	const key = identifier[identifier.length - 1].toLowerCase()
	const colorIndex = chiasmColors[key]
	return colors[colorIndex]
}
