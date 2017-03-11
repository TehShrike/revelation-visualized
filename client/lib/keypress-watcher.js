const inViewport = require('lib/in-viewport')
const getParametersWithTranslationToggled = require('lib/toggle-translation-parameter')
const createKeyboardListener = require('lib/keyboard-shortcut')

const keyCodes = {
	g: 71
}

module.exports = function startKeypressWatcher(router) {
	createKeyboardListener({
		[keyCodes.g]: () => {
			const parameters = getParametersWithTranslationToggled(router.getCurrentParameters())

			router.navigate({
				parameters,
				element: getFirstAnchorInViewport()
			})
		}
	})
}

function getFirstAnchorInViewport() {
	const [ firstAnchorInViewport ] = [...document.querySelectorAll('a')]
		.filter(element => element.id)
		.filter(element => inViewport(element))

	return firstAnchorInViewport
}
