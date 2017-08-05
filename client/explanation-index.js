const RevelationProjectMenu = require('revelation-project-menu')
const Outline = require('./explanation/Outline.html')
const Subsections = require('./explanation/Subsections.html')
const InnerChiasm = require('./explanation/InnerChiasm.html')

const createKeyboardListener = require('lib/keyboard-shortcut')

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
