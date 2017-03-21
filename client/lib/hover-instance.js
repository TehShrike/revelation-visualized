const withinRange = require('multi-part-range-compare')
const createHoverInstance = require('lib/hover/index')

function verseIsInSermonRange(targetVerse, sermonRange) {
	return withinRange(sermonRange[0], sermonRange[1], targetVerse)
}

function sermonContainsVerseRange(sermonRange, verseReference) {
	return withinRange(sermonRange[0], sermonRange[1], verseReference)
}

module.exports.sermonHover = createHoverInstance(verseIsInSermonRange)
module.exports.verseHover = createHoverInstance(sermonContainsVerseRange)
