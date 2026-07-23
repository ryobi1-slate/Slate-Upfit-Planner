export type IntakeFieldStatus =
	| 'recognized'
	| 'uncertain'
	| 'not_found'
	| 'unsupported';

export interface IntakeField {
	value: string | number | boolean | null;
	source_snippet: string;
	confidence: number;
	status: IntakeFieldStatus;
}

export interface BuildSheetIntakeResponse {
	ok: boolean;
	filename?: string;
	status:
		| 'text_extracted'
		| 'no_embedded_text'
		| 'unreadable_pdf'
		| 'unsupported_pdf'
		| 'parser_error';
	code?: string;
	message?: string;
	fields: Record< string, IntakeField >;
	recognized_option_codes: string[];
	unknown_option_codes: string[];
}

export interface BuildSheetCorrections {
	modelYear: string;
	wheelbase: string;
	roofHeight: string;
	drivetrain: string;
	vehicleType: string;
}

export function matchSupportedBuildSheetVehicle(
	corrections: Pick< BuildSheetCorrections, 'wheelbase' | 'roofHeight' >
): string | null {
	const roof = corrections.roofHeight.trim().toLowerCase();
	if ( roof !== 'high' ) {
		return null;
	}
	const wheelbase = corrections.wheelbase.trim();
	if ( wheelbase === '144' ) {
		return 'sprinter-144-high-roof';
	}
	if ( wheelbase === '170' ) {
		return 'sprinter-170-high-roof';
	}

	return null;
}
