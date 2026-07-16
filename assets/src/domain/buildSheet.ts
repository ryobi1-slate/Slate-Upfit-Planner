export interface BuildSheet {
	schema_version: '1.0';
	configuration_id: string | null;
	vehicle: Record< string, unknown >;
	package: Record< string, unknown > | null;
	components: ReadonlyArray< Record< string, unknown > >;
	unplaced_items: ReadonlyArray< Record< string, unknown > >;
	payload: Record< string, unknown >;
	engineering_data: Record< string, unknown >;
}
