import english from 'revelation'
import greek from 'majority-text-family-35-revelation'

import Revelation from 'component/Revelation.html'
import Title from 'component/Title.html'

import router from 'svelte-querystring-router'
import positionPreserver from 'lib/position-preserver'
import keypressWatcher from 'lib/keypress-watcher'

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
