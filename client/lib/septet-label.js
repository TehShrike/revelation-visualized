const labels = {
	a: 1,
	b: 2,
	c: 3,
	d: 4,
	e: 5,
	f: 6,
	g: 7
}

module.exports = function septetLabel(identifier) {
	return labels[identifier] || 'Interlude'
}
