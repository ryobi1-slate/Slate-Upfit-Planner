export type WestcanCategoryCandidate =
	| 'shelving'
	| 'partition'
	| 'liner'
	| 'ladder_rack'
	| 'cabinet'
	| 'drawer'
	| 'workbench'
	| 'accessory'
	| 'mounting_kit'
	| 'storage'
	| 'exterior'
	| 'unknown';

/**
 * Conservative intake-only classifier. Ambiguous names remain unknown.
 *
 * @param partNumber Source part number.
 * @param sourceName Source product name.
 */
export function classifyWestcanProduct(
	partNumber: string,
	sourceName: string
): WestcanCategoryCandidate {
	const value = `${ partNumber } ${ sourceName }`.toLowerCase();
	if (
		/\b(mount|mounting|install|installation|bracket|hold[- ]?down) kit\b/.test(
			value
		)
	) {
		return 'mounting_kit';
	}
	if ( /\bpartition\b/.test( value ) ) {
		return 'partition';
	}
	if ( /\b(liner|wall lining|ceiling lining)\b/.test( value ) ) {
		return 'liner';
	}
	if ( /\bladder rack\b/.test( value ) ) {
		return 'ladder_rack';
	}
	if ( /\b(shelf|shelving)\b/.test( value ) ) {
		return 'shelving';
	}
	if ( /\b(cabinet|locker)\b/.test( value ) ) {
		return 'cabinet';
	}
	if ( /\bdrawer\b/.test( value ) ) {
		return 'drawer';
	}
	if ( /\bworkbench\b/.test( value ) ) {
		return 'workbench';
	}
	if ( /\b(storage|tote holder|spool holder)\b/.test( value ) ) {
		return 'storage';
	}
	if ( /\b(cab guard|canopy|rear rack|rail cap)\b/.test( value ) ) {
		return 'exterior';
	}
	if ( /\b(accessory|hook|holder|divider|door front|step)\b/.test( value ) ) {
		return 'accessory';
	}
	return 'unknown';
}
