import type { CatalogProductRecord } from '../assets/src/domain/catalog';
import { describe, expect, it } from '@jest/globals';
import type { CompatibilityRuleRecord } from '../assets/src/domain/compatibility';
import type { GeometryRecord } from '../assets/src/domain/geometry';
import type { TradePackageRecord } from '../assets/src/domain/package';
import type { VehicleRecord } from '../assets/src/domain/vehicle';
import { CatalogRepository } from '../assets/src/repositories/CatalogRepository';
import { CompatibilityRuleRepository } from '../assets/src/repositories/CompatibilityRuleRepository';
import { GeometryRepository } from '../assets/src/repositories/GeometryRepository';
import { PackageRepository } from '../assets/src/repositories/PackageRepository';
import { VehicleRepository } from '../assets/src/repositories/VehicleRepository';
import { createRepositories } from '../assets/src/repositories/createRepositories';
import vehicleJson from '../data/fixtures/vehicles/sprinter-144-high-roof-draft.vehicle.json';
import geometryJson from '../data/fixtures/vehicles/sprinter-144-high-roof-draft.geometry.json';
import productJson from '../data/fixtures/catalog/westcan-22-3438-draft.product.json';
import ruleJson from '../data/fixtures/compatibility/westcan-22-3438-draft.rule.json';
import packageJson from '../data/fixtures/packages/general-service-draft.package.json';

const clone = < T >( value: T ): T =>
	JSON.parse( JSON.stringify( value ) ) as T;
const vehicle = vehicleJson as unknown as VehicleRecord;
const geometry = geometryJson as unknown as GeometryRecord;
const product = productJson as unknown as CatalogProductRecord;
const rule = ruleJson as unknown as CompatibilityRuleRecord;
const pkg = packageJson as unknown as TradePackageRecord;

describe( 'read-only repositories', () => {
	it( 'lists approved records by default and permits explicit draft loading', () => {
		const repository = new VehicleRepository( [ vehicle ] );
		expect( repository.list() ).toEqual( [] );
		expect( repository.list( [ 'draft' ] ) ).toHaveLength( 1 );
	} );

	it( 'defensively copies and freezes supplied records', () => {
		const supplied = clone( vehicle );
		const repository = new VehicleRepository( [ supplied ] );
		supplied.data.model = 'Changed outside';
		const resolved = repository.resolve(
			vehicle.data.vehicle_id,
			vehicle.metadata.record_revision
		);
		expect( resolved?.data.model ).toBe( 'Sprinter' );
		expect( Object.isFrozen( resolved ) ).toBe( true );
	} );

	it( 'resolves deprecated records for historical use', () => {
		const deprecated = clone( vehicle );
		deprecated.metadata.approval_state = 'deprecated';
		const repository = new VehicleRepository( [ deprecated ] );
		expect( repository.list() ).toEqual( [] );
		expect(
			repository.resolve(
				deprecated.data.vehicle_id,
				deprecated.metadata.record_revision
			)
		).toBeDefined();
	} );

	it( 'rejects duplicate repository keys', () => {
		expect(
			() => new VehicleRepository( [ vehicle, clone( vehicle ) ] )
		).toThrow( /Duplicate vehicle/ );
		expect(
			() => new GeometryRepository( [ geometry, clone( geometry ) ] )
		).toThrow( /Duplicate geometry/ );
		expect(
			() => new CatalogRepository( [ product, clone( product ) ] )
		).toThrow( /Duplicate manufacturer/ );
		expect( () => new PackageRepository( [ pkg, clone( pkg ) ] ) ).toThrow(
			/Duplicate package/
		);
		expect(
			() => new CompatibilityRuleRepository( [ rule, clone( rule ) ] )
		).toThrow( /Duplicate rule/ );
	} );

	it( 'rejects missing references', () => {
		expect( () =>
			createRepositories( {
				vehicles: [ vehicle ],
				geometries: [],
				catalog: [ product ],
				rules: [ rule ],
				packages: [ pkg ],
			} )
		).toThrow( /missing geometry/ );

		const missingGeometryId = clone( vehicle );
		missingGeometryId.data.geometry_id = 'missing-geometry';
		missingGeometryId.data.geometry_revision = null;
		expect( () =>
			createRepositories( {
				vehicles: [ missingGeometryId ],
				geometries: [ geometry ],
				catalog: [ product ],
				rules: [ rule ],
				packages: [ pkg ],
			} )
		).toThrow( /missing geometry missing-geometry/ );
	} );

	it( 'rejects missing package and component rule references', () => {
		const packageWithMissingFallback = clone( pkg );
		packageWithMissingFallback.data.fallback_rules = [ 'missing-rule' ];
		expect( () =>
			createRepositories( {
				vehicles: [ vehicle ],
				geometries: [ geometry ],
				catalog: [ product ],
				rules: [ rule ],
				packages: [ packageWithMissingFallback ],
			} )
		).toThrow( /missing fallback rule missing-rule/ );

		const packageWithMissingComponentRule = clone( pkg );
		packageWithMissingComponentRule.data.components = [
			{
				component_id: 'draft-component',
				sku: product.data.sku,
				requirement: 'required',
				quantity: 1,
				preferred_surface: 'driver_wall',
				placement_order: 1,
				fallback_rule_ids: [],
				compatibility_rule_ids: [ 'missing-component-rule' ],
			},
		];
		expect( () =>
			createRepositories( {
				vehicles: [ vehicle ],
				geometries: [ geometry ],
				catalog: [ product ],
				rules: [ rule ],
				packages: [ packageWithMissingComponentRule ],
			} )
		).toThrow( /missing compatibility rule missing-component-rule/ );
	} );

	it( 'creates repositories when all references resolve', () => {
		const repositories = createRepositories( {
			vehicles: [ vehicle ],
			geometries: [ geometry ],
			catalog: [ product ],
			rules: [ rule ],
			packages: [ pkg ],
		} );
		expect( repositories.catalog.list( [ 'draft' ] ) ).toHaveLength( 1 );
	} );
} );
