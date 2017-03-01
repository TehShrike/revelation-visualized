const Link = require('./link.html')
const EventEmitter = require('eventemitter3')

function defaultPushState(state, title, url) {
	history.pushState(state, title, url)
}

function defaultCurrentQuerystring() {
	const querystring = location.search
	const keyValuePairs = querystring.length > 1
		?	querystring.slice(1).split('&').map(keyValuePairString => keyValuePairString.split('='))
		: []

	const parameters = keyValuePairs.reduce((map, [ key, value ]) => {
		map[key] = value
		return map
	}, Object.create(null))

	return {
		querystring,
		parameters
	}
}

module.exports = function createRouterInstance(pushState = defaultPushState, currentQuerystring = defaultCurrentQuerystring) {
	const emitter = new EventEmitter()
	let current = currentQuerystring()

	return {
		Link: function linkProxy(options) {
			const linkComponent = new Link(options)

			linkComponent.on('navigate', ({ querystring, parameters }) => {
				current = { querystring, parameters }
				emitter.emit('navigate', { querystring, parameters })
				pushState(parameters, '', querystring)
			})

			return linkComponent
		},
		mountComponent(component) {
			function navigateListener({ parameters }) {
				component.set({
					querystringParameters: parameters
				})
			}
			emitter.on('navigate', navigateListener)
			component.on('teardown', () => emitter.removeListener('navigate', navigateListener))
			component.set({
				querystringParameters: current.parameters
			})
		}
	}
}
