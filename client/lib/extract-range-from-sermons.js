const {
	VERSE_SECTION_RANGE_MIN
} = require('lib/constants')

const withinRange = require('multi-part-range-compare')

module.exports = function extractRangeFromSermons(sermons, range) {
	const [ rangeStart, rangeEnd ] = range
	const matching = []

	let insideMatchingRange = false
	let hitEndOfRange = false
	sermons.forEach(sermon => {
		if (!hitEndOfRange) {
			const [ chapterNumber, verseNumber ] = sermon.range[0]

			const currentSermonIsInRange = withinRange(rangeStart, rangeEnd,
				[ chapterNumber, verseNumber, VERSE_SECTION_RANGE_MIN ])

			hitEndOfRange = insideMatchingRange && !currentSermonIsInRange
			insideMatchingRange = currentSermonIsInRange

			if (insideMatchingRange) {
				matching.push(sermon)
			}
		}
	})

	return matching
}
