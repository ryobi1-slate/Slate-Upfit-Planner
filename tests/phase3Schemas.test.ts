import Ajv2020 from 'ajv/dist/2020';
import { describe, expect, it, test } from '@jest/globals';
import envelopeSchema from '../data/schemas/engineering-data-envelope-1.0.schema.json';
import vehicleSchema from '../data/schemas/vehicle-1.0.schema.json';
import geometrySchema from '../data/schemas/geometry-1.0.schema.json';
import catalogSchema from '../data/schemas/catalog-product-1.0.schema.json';
import ruleSchema from '../data/schemas/compatibility-rule-1.0.schema.json';
import packageSchema from '../data/schemas/trade-package-1.0.schema.json';
import preloadSchema from '../data/schemas/preload-result-1.0.schema.json';
import buildSheetSchema from '../data/schemas/build-sheet-1.0.schema.json';
import configuration1Schema from '../data/schemas/configuration-1.0.schema.json';
import configuration11Schema from '../data/schemas/configuration-1.1.schema.json';
import vehicleDraft from '../data/fixtures/vehicles/sprinter-144-high-roof-draft.vehicle.json';
import geometryDraft from '../data/fixtures/vehicles/sprinter-144-high-roof-draft.geometry.json';
import productDraft from '../data/fixtures/catalog/westcan-22-3438-draft.product.json';
import ruleDraft from '../data/fixtures/compatibility/westcan-22-3438-draft.rule.json';
import packageDraft from '../data/fixtures/packages/general-service-draft.package.json';
import configuration1 from '../data/fixtures/migrations/configuration-1.0-minimal.json';
import configuration11 from '../data/fixtures/migrations/configuration-1.1-minimal.json';

const ajv = new Ajv2020( { allErrors: true, strict: false } );
ajv.addFormat( 'date', /^\d{4}-\d{2}-\d{2}$/ );
[
	envelopeSchema,
	vehicleSchema,
	geometrySchema,
	catalogSchema,
	ruleSchema,
	packageSchema,
	preloadSchema,
	buildSheetSchema,
	configuration1Schema,
	configuration11Schema,
].forEach( ( schema ) => ajv.addSchema( schema ) );

const copy = ( value: unknown ): Record< string, any > =>
	JSON.parse( JSON.stringify( value ) ) as Record< string, any >;

describe( 'Phase 3 schemas', () => {
	test.each( [
		[ 'vehicle', vehicleSchema.$id, vehicleDraft ],
		[ 'geometry', geometrySchema.$id, geometryDraft ],
		[ 'catalog', catalogSchema.$id, productDraft ],
		[ 'rule', ruleSchema.$id, ruleDraft ],
		[ 'package', packageSchema.$id, packageDraft ],
		[ 'configuration 1.0', configuration1Schema.$id, configuration1 ],
		[ 'configuration 1.1', configuration11Schema.$id, configuration11 ],
	] )( 'accepts valid draft %s', ( _name, id, fixture ) =>
		expect( ajv.validate( id, fixture ) ).toBe( true )
	);

	it( 'accepts an approved record only with complete provenance', () => {
		const approved = copy( vehicleDraft );
		approved.metadata.approval_state = 'approved';
		approved.metadata.source.reference = 'OEM-GUIDE-1';
		approved.metadata.source.retrieved_on = '2026-07-15';
		approved.metadata.prepared_by = 'product';
		approved.metadata.verified_by = 'engineering';
		approved.metadata.approved_by = 'engineering-owner';
		approved.metadata.last_verified = '2026-07-15';
		expect( ajv.validate( vehicleSchema.$id, approved ) ).toBe( true );
		approved.metadata.approved_by = null;
		expect( ajv.validate( vehicleSchema.$id, approved ) ).toBe( false );
	} );

	it( 'rejects unexpected properties, versions, and approval states', () => {
		const extra = copy( vehicleDraft );
		extra.pricing = 1;
		expect( ajv.validate( vehicleSchema.$id, extra ) ).toBe( false );
		const version = copy( vehicleDraft );
		version.schema_version = '9.0';
		expect( ajv.validate( vehicleSchema.$id, version ) ).toBe( false );
		const state = copy( vehicleDraft );
		state.metadata.approval_state = 'published';
		expect( ajv.validate( vehicleSchema.$id, state ) ).toBe( false );
	} );

	it( 'rejects null verified values and zero pending values', () => {
		const verifiedNull = copy( vehicleDraft );
		verifiedNull.data.wheelbase = {
			value: null,
			unit: 'in',
			status: 'verified',
		};
		expect( ajv.validate( vehicleSchema.$id, verifiedNull ) ).toBe( false );
		const pendingZero = copy( vehicleDraft );
		pendingZero.data.wheelbase = {
			value: 0,
			unit: 'in',
			status: 'pending',
		};
		expect( ajv.validate( vehicleSchema.$id, pendingZero ) ).toBe( false );
	} );
} );
