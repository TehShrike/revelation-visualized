const path = require('path')

module.exports = function(file) {
	return !/node_modules/.test(file) && ['', '.js', '.html'].includes(path.extname(file))
}
