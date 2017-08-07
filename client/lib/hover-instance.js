import withinRange from 'multi-part-range-compare'
import createHoverInstance from 'lib/hover/index'

function verseIsInSermonRange(targetVerse, sermonRange) {
	return withinRange(sermonRange[0], sermonRange[1], targetVerse)
}

function sermonContainsVerseRange(sermonRange, verseReference) {
	return withinRange(sermonRange[0], sermonRange[1], verseReference)
}

const sermonHover = createHoverInstance(verseIsInSermonRange)
const verseHover = createHoverInstance(sermonContainsVerseRange)

export {
	sermonHover,
	verseHover,
}
