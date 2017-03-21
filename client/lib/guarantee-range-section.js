const { VERSE_SECTION_RANGE_MIN } = require('lib/constants')

module.exports = function guaranteeRangeSection(range, defaultSection = VERSE_SECTION_RANGE_MIN) {
	if (range.length === 3) {
		return range
	} else {
		return [ ...range, defaultSection ]
	}
}
