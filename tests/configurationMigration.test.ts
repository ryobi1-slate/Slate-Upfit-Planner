import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it } from '@jest/globals';
import { migrateConfiguration1To11 } from '../assets/src/services/configurationMigration';
import type { ConfigurationV1 } from '../assets/src/domain/configuration';
import configuration11Schema from '../data/schemas/configuration-1.1.schema.json';
import sourceJson from '../data/fixtures/migrations/configuration-1.0-minimal.json';
import legacyJson from './fixtures/configurations/valid-configuration.json';

describe( 'configuration 1.0 to 1.1 migration', () => {
	it( 'is deterministic, immutable, and preserves identity and coordinates', () => {
		const source = sourceJson as unknown as ConfigurationV1;
		const before = JSON.stringify( source );
		const first = migrateConfiguration1To11( source );
		const second = migrateConfiguration1To11( source );
		expect( first ).toEqual( second );
		expect( JSON.stringify( source ) ).toBe( before );
		expect( first.configuration.configuration_id ).toBe(
			source.configuration_id
		);
		expect( first.configuration.placements ).toEqual( source.placements );
		expect( first.configuration.vehicle.geometry_revision ).toBeNull();
		expect( first.configuration.package_origin ).toBeNull();
		expect( first.configuration.unplaced_items ).toEqual( [] );
		expect( first.warnings.map( ( warning ) => warning.code ) ).toEqual( [
			'GEOMETRY_REVISION_UNRESOLVED',
			'CATALOG_REVISION_UNRESOLVED',
		] );
	} );

	it( 'validates migrated output against configuration 1.1', () => {
		const validate = new Ajv2020( { strict: false } ).compile(
			configuration11Schema
		);
		expect(
			validate(
				migrateConfiguration1To11(
					sourceJson as unknown as ConfigurationV1
				).configuration
			)
		).toBe( true );
	} );

	it( 'keeps the existing v0.2.5 fixture readable', () => {
		const migrated = migrateConfiguration1To11(
			legacyJson as unknown as ConfigurationV1
		);
		expect( migrated.configuration.schema_version ).toBe( '1.1' );
		expect( migrated.configuration.placements ).toHaveLength(
			legacyJson.placements.length
		);
	} );
} );
