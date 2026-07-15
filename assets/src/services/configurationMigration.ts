import type {
	ConfigurationV1,
	ConfigurationV11,
} from '../domain/configuration';

export type MigrationIssueCode =
	| 'GEOMETRY_REVISION_UNRESOLVED'
	| 'CATALOG_REVISION_UNRESOLVED';

export interface MigrationWarning {
	code: MigrationIssueCode;
	message: string;
	sku?: string;
}

export interface ConfigurationMigrationResult {
	configuration: ConfigurationV11;
	warnings: MigrationWarning[];
	source_schema_version: '1.0';
	target_schema_version: '1.1';
}

export function migrateConfiguration1To11(
	source: ConfigurationV1
): ConfigurationMigrationResult {
	const catalogRevisions = Array.from(
		new Set( source.placements.map( ( placement ) => placement.sku ) )
	)
		.sort()
		.map( ( sku ) => ( {
			manufacturer: 'unresolved',
			sku,
			revision: null,
			status: 'unresolved' as const,
		} ) );
	const warnings: MigrationWarning[] = [
		{
			code: 'GEOMETRY_REVISION_UNRESOLVED',
			message:
				'The configuration does not prove which geometry revision was used.',
		},
		...catalogRevisions.map( ( reference ) => ( {
			code: 'CATALOG_REVISION_UNRESOLVED' as const,
			message: `Catalog revision is unresolved for SKU ${ reference.sku }.`,
			sku: reference.sku,
		} ) ),
	];

	return {
		configuration: {
			...clone( source ),
			schema_version: '1.1',
			vehicle: { ...clone( source.vehicle ), geometry_revision: null },
			catalog_revisions: catalogRevisions,
			package_origin: null,
			unplaced_items: [],
			engineering_data: {
				status: 'unresolved',
				geometry_revision_status: 'unresolved',
				catalog_revision_status: 'unresolved',
			},
		},
		warnings,
		source_schema_version: '1.0',
		target_schema_version: '1.1',
	};
}

function clone< T >( value: T ): T {
	return JSON.parse( JSON.stringify( value ) ) as T;
}
