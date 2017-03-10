const inViewport = require('lib/in-viewport')
const getParametersWithTranslationToggled = require('lib/toggle-translation-parameter')

const keyCodes = {
	g: 71
}

// window.getSelection()
module.exports = function startKeypressWatcher(router) {
	document.addEventListener('keydown', event => {
		if (event.keyCode === keyCodes.g) {
			event.preventDefault()

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
