import type { ConfigurationPayload as ConfigurationV1 } from '../types';

export type { ConfigurationV1 };
export interface CatalogRevisionReference {
	manufacturer: string;
	sku: string;
	revision: string | null;
	status: 'resolved' | 'unresolved';
}
export interface PackageDivergence {
	status: 'aligned' | 'diverged';
	added_placement_ids: string[];
	removed_component_refs: string[];
	quantity_changes: Array< Record< string, unknown > >;
	position_changes: Array< Record< string, unknown > >;
	surface_changes: Array< Record< string, unknown > >;
}
export interface ConfigurationV11
	extends Omit< ConfigurationV1, 'schema_version' | 'vehicle' > {
	schema_version: '1.1';
	vehicle: ConfigurationV1[ 'vehicle' ] & {
		geometry_revision: string | null;
	};
	catalog_revisions: CatalogRevisionReference[];
	package_origin: null | {
		package_id: string;
		package_revision: string;
		baseline_fingerprint: string;
		divergence: PackageDivergence;
	};
	unplaced_items: Array< {
		sku: string;
		requirement: 'required' | 'optional';
		reason_code: string;
	} >;
	engineering_data: {
		status: 'resolved' | 'partially_resolved' | 'unresolved';
		geometry_revision_status: 'resolved' | 'unresolved';
		catalog_revision_status: 'resolved' | 'unresolved';
	};
}
