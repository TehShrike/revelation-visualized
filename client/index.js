const english = require('revelation')
const greek = require('majority-text-family-35-revelation')

const Revelation = require('component/revelation.html')
const Title = require('component/title.html')

const router = require('lib/router-instance')
const positionPreserver = require('lib/position-preserver')
const keypressWatcher = require('lib/keypress-watcher')

const revelationComponent = new Revelation({
	target: document.querySelector('#verses'),
	data: {
		translations: {
			greek,
			english
		}
	}
})
router.attachQuerystringData(revelationComponent)
console.log(revelationComponent.get('structuredText'))

router.attachQuerystringData(new Title({
	target: document.querySelector('title')
}))

positionPreserver(router)
keypressWatcher(router)
