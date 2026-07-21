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
		/\b(mount|mounting|install|installation|bracket|hold[- ]?down) kits?\b/.test(
			value
		)
	) {
		return 'mounting_kit';
	}
	if ( /\bpartition\b/.test( value ) ) {
		return 'partition';
	}
	if ( /\b(liners?|wall lining|ceiling lining)\b/.test( value ) ) {
		return 'liner';
	}
	if ( /\bladder racks?\b/.test( value ) ) {
		return 'ladder_rack';
	}
	if ( /\b(cabinets?|lockers?)\b/.test( value ) ) {
		return 'cabinet';
	}
	if ( /\bdrawers?\b/.test( value ) ) {
		return 'drawer';
	}
	if ( /\bworkbench\b/.test( value ) ) {
		return 'workbench';
	}
	if ( /\b(storage|tote holders?|spool holders?)\b/.test( value ) ) {
		return 'storage';
	}
	if ( /\b(cab guards?|canopy|rear racks?|rail caps?)\b/.test( value ) ) {
		return 'exterior';
	}
	if (
		/\b(accessory|accessories|hangers?|hooks?|holders?|dividers?|door fronts?|steps?)\b/.test(
			value
		)
	) {
		return 'accessory';
	}
	if ( /\b(shelves|shelf|shelving)\b/.test( value ) ) {
		return 'shelving';
	}
	return 'unknown';
}
