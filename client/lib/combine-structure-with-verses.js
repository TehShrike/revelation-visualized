const oneToManyZip = require('one-to-many-array-zip')
const withinRange = require('multi-part-range-compare')

const getSectionRange = require('lib/get-section-range')

module.exports = function combineStructureWithVerses(structure, verses) {
	return oneToManyZip(structure, verses, (section, verse) => {
		const { rangeStart, rangeEnd } = getSectionRange(section)

		return verse.type !== 'verse' || withinRange(rangeStart, rangeEnd, verseReference(verse))
	}).map(({ one: section, many: verses }) => Object.assign({}, section, { verses }))
}

function verseReference({ chapterNumber, verseNumber, sectionNumber }) {
	return [ chapterNumber, verseNumber, sectionNumber ]
}
