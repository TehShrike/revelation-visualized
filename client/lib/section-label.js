module.exports = function sectionLabel(section) {
	return section.prime ? `${section.identifier}′` : section.identifier
}
