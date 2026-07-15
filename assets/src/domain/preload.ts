export type PreloadBucket =
	| 'placed'
	| 'placed_with_warnings'
	| 'unplaced'
	| 'incompatible'
	| 'missing_data';

export interface PreloadResult {
	schema_version: '1.0';
	strategy_version: string;
	vehicle: { id: string; revision: string };
	package: { id: string; revision: string };
	status: 'complete' | 'partial' | 'failed';
	results: Record<
		PreloadBucket,
		ReadonlyArray< Record< string, unknown > >
	>;
	summary: {
		requested: number;
		accounted_for: number;
		required_failures: number;
		optional_failures: number;
	};
}
