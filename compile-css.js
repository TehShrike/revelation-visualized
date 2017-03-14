const path = require('path')
const fs = require('fs')

const postcss = require('postcss')
const precss = require('precss')
const autoprefixer = require('autoprefixer')

const denodeify = require('then-denodeify')
const chokidar = require('chokidar')

const readFile = denodeify(fs.readFile)
const writeFile = denodeify(fs.writeFile)

async function build(filePath) {
	const basename = path.basename(filePath)
	const destination = `./public/${basename}`
	const contents = await readFile(filePath, { encoding: 'utf8' })

	const result = await postcss([ precss, autoprefixer ]).process(contents, {
		from: filePath,
		to: destination
	})

	await Promise.all([
		writeFile(destination, result),
		writeFile(`${destination}.map`, result.map)
	])
}

async function regularBuild() {
	await Promise.all([
		build('./client/index-style.css'),
		build('./client/shared-style.css'),
		build('./client/explanation/explanation-style.css')
	])
}

regularBuild()
