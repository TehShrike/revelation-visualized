require('svelte/ssr/register')

const outline = require('./explanation/outline.html')
const indexHtml = require('fs').readFileSync('./client/explanation/explanation-template.html', { encoding: 'utf8' })

const { css: outlineCss, components: outlineComponentsCss } = outline.renderCss()

const outputHtml = indexHtml
.replace('<!-- outline -->', () => outline.render())
.replace('<style></style>', () => `<style>${outlineCss}</style>`)

require('fs').writeFileSync('./explanation.html', outputHtml)
