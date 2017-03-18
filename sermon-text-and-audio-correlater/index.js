const Butler = require('noddity-butler')
const level = require('level-mem')
const denodeify = require('then-denodeify')
const Retrieval = require('noddity-fs-retrieval')

const compareDateAsc = require('date-fns/compare_asc')
const formatDate = require('date-fns/format')
const isSunday = require('date-fns/is_sunday')
const addDays = require('date-fns/add_days')

const retrieval = new Retrieval('/Users/josh/code/KayserCommentary/content')

const butler = Butler(retrieval, level('server'), {
	parallelPostRequests: 10
})

const dateToIdAndTitle = [
	[999, `The Two Witnesses, Part 2`, `2017-03-05`],
	[997, `The Two Witnesses, part 1`, `2017-01-29`],
	[992, `Temple of Doom; City Handed Over`, `2017-01-08`],
	[974, `The Anticipated Closing of the Canon`, `2016-11-13`],
	[1001, `The Divine Character of Revelation, part 2`, `2016-11-06`],
	[973, `The Divine Character of Revelation`, `2016-10-30`],
	[971, `The Angel and the Book`, `2016-10-23`],
	[969, `Sixth Trumpet, part 2`, `2016-10-16`],
	[983, `Sixth Trumpet Part 1`, `2016-09-18`],
	[966, `Fifth Trumpet, part 4`, `2016-09-11`],
	[964, `Fifth Trumpet, part 3`, `2016-09-04`],
	[954, `Fifth Trumpet, part 2`, `2016-08-21`],
	[955, `Revelation 9:1-12, part 1`, `2016-08-14`],
	[962, `Fourth Trumpet`, `2016-08-07`],
	[956, `Third Trumpet`, `2016-07-31`],
	[942, `Second Trumpet - Burning Mountain`, `2016-06-26`],
	[940, `Hail, Fire, and Blood`, `2016-06-19`],
	[938, `Power in Prayer`, `2016-06-12`],
	[934, `Experiencing the Joy of Heaven`, `2016-05-22`],
	[930, `The Great Tribulation Martyrs, part 2`, `2016-05-15`],
	[931, `The Great Tribulation Martyrs, part 1`, `2016-05-08`],
	[838, `God's Incredible Protection`, `2016-04-17`],
	[839, `Cosmic Disturbances`, `2016-04-10`],
	[835, `The Cry of the Martyrs: Was it Answered?`, `2016-04-03`],
	[831, `The Fourth Horseman`, `2016-03-06`],
	[827, `The Third Horseman`, `2016-02-28`],
	[825, `The Second Horseman`, `2016-02-21`],
	[822, `The First Horseman`, `2016-02-14`],
	[821, `The Four Horsemen`, `2016-02-07`],
	[820, `Worship According to the Pattern in Heaven`, `2016-01-31`],
	[817, `Who is Worthy: Christology and Eschatology`, `2016-01-24`],
	[812, `Identity of the Scroll`, `2016-01-17`],
	[815, `Made for Worship`, `2016-01-10`],
	[804, `Cherubim`, `2016-01-03`],
	[803, `Command Central`, `2015-12-20`],
	[801, `Passionate About the Kingdom?`, `2015-12-13`],
	[799, `Sweet Encouragement`, `2015-12-06`],
	[794, `When Contentment Is Not A Virtue`, `2015-11-29`],
	[793, `Ungodly Tolerance, part 2`, `2015-11-22`],
	[792, `Ungodly Toleration, part 1`, `2015-11-15`],
	[786, `The Dangers and Thrills of Spiritual Battle`, `2015-10-25`],
	[785, `Gaining Perspective on Tribulation`, `2015-10-11`],
	[784, `Can First Love Be Regained`, `2015-10-04`],
	[783, `What is Jesus Doing on Sunday`, `2015-09-27`],
	[776, `Divine Guidance For Understanding Revelation - Part 14`, `2015-09-20`],
	[773, `Divine Guidance for Understanding Revelation - part 13`, `2015-08-23`],
	[771, `Divine Guidance For Understanding Revelation - Part 12`, `2015-08-16`],
	[769, `Divine Guidance For Understanding Revelation - Part 11`, `2015-08-09`],
	[765, `Divine Guidance for Understanding Revelation - Part 10`, `2015-08-02`],
	[766, `Divine Guidance for Understanding Revelation - Part 9`, `2015-07-26`],
	[762, `Divine Guidance for Understanding Revelation - part 8`, `2015-07-19`],
	[763, `Divine Guidance For Understanding Revelation - part 7`, `2015-07-05`],
	[754, `Divine Guidance for Understanding Revelation, part 6`, `2015-06-14`],
	[755, `Divine Guidance for Understanding Revelation, part 5`, `2015-06-07`],
	[750, `Divine Guidance for Understanding Revelation, part 4`, `2015-05-24`],
	[747, `Divine Guidance for Understanding Revelation, part 3`, `2015-05-17`],
	[745, `Divine Guidance for Understanding Revelation, part 2`, `2015-05-10`],
	[742, `Divine Guidance to the Book of Revelation, part 1`, `2015-05-03`],
	[741, `Genesis & Revelation`, `2015-04-26`],
].reduce((map, [ id, title, dateString ]) => {
	map[dateString] = { id, title }
	return map
}, Object.create(null))

// print(dateToIdAndTitle)

denodeify(butler.getPosts)().then(posts => {
	const revelationPosts = posts.filter(post => {
		return post.metadata.published
			&& /^Sermons\/New Testament\/Revelation\/Revelation/.test(post.filename)
			&& !/GraphicsCharts/.test(post.filename)
			&& !/Revelation timeline/.test(post.filename)
	}).map(({ filename, metadata }) => {
		const { passage, date, title } = metadata
		return {
			filename,
			passage,
			date,
			title
		}
	}).sort((postA, postB) => {
		return compareDateAsc(postA.date, postB.date)
	}).map(({ filename, passage, date, title }) => {
		const isoDateString = formatDate(nextSunday(date), 'YYYY-MM-DD')
		// console.log(isoDateString, dateToId[isoDateString])
		return {
			title,
			passage,
			filename,
			date: isoDateString,
			audioId: dateToIdAndTitle[isoDateString] && dateToIdAndTitle[isoDateString].id,
			// audioTitle: dateToIdAndTitle[isoDateString] && dateToIdAndTitle[isoDateString].title
		}
	})
	print(revelationPosts)
})

function print(structure) {
	console.log(JSON.stringify(structure, null, '\t'))
}

function nextSunday(date) {
	if (isSunday(date)) {
		return date
	} else {
		return nextSunday(addDays(date, 1))
	}
}
