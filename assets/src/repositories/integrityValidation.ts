import type { CatalogProductRecord } from '../domain/catalog';
import type { CompatibilityRuleRecord } from '../domain/compatibility';
import type { GeometryRecord } from '../domain/geometry';
import type { TradePackageRecord } from '../domain/package';
import type { EngineeringRecord } from '../domain/provenance';
import type { VehicleRecord } from '../domain/vehicle';

export class RepositoryIntegrityError extends Error {}

export function immutableCopy< T >( value: T ): Readonly< T > {
	return deepFreeze( JSON.parse( JSON.stringify( value ) ) as T );
}

function deepFreeze< T >( value: T ): Readonly< T > {
	if ( value !== null && typeof value === 'object' ) {
		Object.values( value as Record< string, unknown > ).forEach(
			deepFreeze
		);
		Object.freeze( value );
	}
	return value;
}

export function assertUnique< T >(
	values: readonly T[],
	key: ( value: T ) => string,
	label: string
): void {
	const seen = new Set< string >();
	for ( const value of values ) {
		const candidate = key( value );
		if ( seen.has( candidate ) ) {
			throw new RepositoryIntegrityError(
				`Duplicate ${ label }: ${ candidate }`
			);
		}
		seen.add( candidate );
	}
}

export function listByApproval< T >(
	records: readonly EngineeringRecord< T >[],
	states: readonly EngineeringRecord< T >[ 'metadata' ][ 'approval_state' ][] = [
		'approved',
	]
): ReadonlyArray< Readonly< EngineeringRecord< T > > > {
	return records.filter( ( record ) =>
		states.includes( record.metadata.approval_state )
	);
}

export function validateRepositoryReferences( input: {
	vehicles: readonly VehicleRecord[];
	geometries: readonly GeometryRecord[];
	catalog: readonly CatalogProductRecord[];
	rules: readonly CompatibilityRuleRecord[];
	packages: readonly TradePackageRecord[];
} ): void {
	const vehicleKeys = new Set(
		input.vehicles.map( ( record ) => record.data.vehicle_id )
	);
	const geometryKeys = new Set(
		input.geometries.map(
			( record ) =>
				`${ record.data.geometry_id }@${ record.data.geometry_revision }`
		)
	);
	const productKeys = new Set(
		input.catalog.map(
			( record ) => `${ record.data.manufacturer }::${ record.data.sku }`
		)
	);
	const ruleKeys = new Set(
		input.rules.map( ( record ) => record.data.rule_id )
	);

	for ( const vehicle of input.vehicles ) {
		if (
			vehicle.data.geometry_revision &&
			! geometryKeys.has(
				`${ vehicle.data.geometry_id }@${ vehicle.data.geometry_revision }`
			)
		) {
			throw new RepositoryIntegrityError(
				`Vehicle ${ vehicle.data.vehicle_id } references missing geometry ${ vehicle.data.geometry_id }@${ vehicle.data.geometry_revision }`
			);
		}
	}
	for ( const geometry of input.geometries ) {
		if ( ! vehicleKeys.has( geometry.data.vehicle_id ) ) {
			throw new RepositoryIntegrityError(
				`Geometry ${ geometry.data.geometry_id } references missing vehicle ${ geometry.data.vehicle_id }`
			);
		}
	}
	for ( const product of input.catalog ) {
		for ( const ruleId of product.data.supported_vehicle_rule_ids ) {
			if ( ! ruleKeys.has( ruleId ) ) {
				throw new RepositoryIntegrityError(
					`Product ${ product.data.sku } references missing rule ${ ruleId }`
				);
			}
		}
		for ( const sku of [
			...product.data.required_products,
			...product.data.excluded_products,
		] ) {
			if (
				! productKeys.has( `${ product.data.manufacturer }::${ sku }` )
			) {
				throw new RepositoryIntegrityError(
					`Product ${ product.data.sku } references missing SKU ${ sku }`
				);
			}
		}
	}
	for ( const pkg of input.packages ) {
		for ( const vehicleId of pkg.data.supported_vehicle_ids ) {
			if ( ! vehicleKeys.has( vehicleId ) ) {
				throw new RepositoryIntegrityError(
					`Package ${ pkg.data.package_id } references missing vehicle ${ vehicleId }`
				);
			}
		}
		for ( const ruleId of pkg.data.compatibility_rule_ids ) {
			if ( ! ruleKeys.has( ruleId ) ) {
				throw new RepositoryIntegrityError(
					`Package ${ pkg.data.package_id } references missing rule ${ ruleId }`
				);
			}
		}
		for ( const component of pkg.data.components ) {
			if (
				! Array.from( productKeys ).some( ( key ) =>
					key.endsWith( `::${ component.sku }` )
				)
			) {
				throw new RepositoryIntegrityError(
					`Package ${ pkg.data.package_id } references missing SKU ${ component.sku }`
				);
			}
		}
	}
}
