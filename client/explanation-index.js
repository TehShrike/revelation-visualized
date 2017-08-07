import RevelationProjectMenu from 'revelation-project-menu'
import Outline from './explanation/Outline.html'
import Subsections from './explanation/Subsections.html'
import InnerChiasm from './explanation/InnerChiasm.html'

import createKeyboardListener from 'lib/keyboard-shortcut'

const mount = (Constructor, elementName) => new Constructor({ target: document.querySelector(elementName) })

mount(RevelationProjectMenu, 'RevelationProjectMenu')
mount(Outline, 'Outline')
mount(Subsections, 'Subsections')
mount(InnerChiasm, 'InnerChiasm')


let easterEggActivated = false
createKeyboardListener({
	71: () => {
		if (!easterEggActivated) {
			easterEggActivated = true
			document.getElementById('tldr').append(` lol, not on this page, I don't have a greek translation of this explanation text.`)
		}
	}
})
