const revelation = require('pickering-majority-text-revelation')

const combineStructureAndVerses = require('lib/combine-structure-and-verses')
const structure = require('lib/structure')

const Revelation = require('component/revelation.html')
const Title = require('component/title.html')

const router = require('lib/router-instance')
const positionPreserver = require('lib/position-preserver')

const structuredText = combineStructureAndVerses(structure, revelation)

console.log(structuredText)

router.attachQuerystringData(new Revelation({
	target: document.querySelector('#verses'),
	data: {
		structuredText
	}
}))

router.attachQuerystringData(new Title({
	target: document.querySelector('title')
}))

positionPreserver(router)
