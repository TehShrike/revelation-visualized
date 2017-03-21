const withinRange = require('multi-part-range-compare')

function isInRange(targetVerse, range) {
	return withinRange(range[0], range[1], targetVerse)
}

module.exports = require('lib/hover/index')(isInRange)
