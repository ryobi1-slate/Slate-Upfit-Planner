/**
 * Smoke tests for the fitment engine boundary. Run with `npm test`
 * (wp-scripts test-unit-js). Uses @jest/globals so no global type setup is
 * needed for the typechecker.
 */

import { describe, it, expect } from '@jest/globals';
import {
	buildNormalizedPayload,
	calculatePayload,
	calculateWallUsage,
	findOpenPlacement,
	validatePlacement,
} from '../assets/src/engine';
import {
	COMPONENTS_BY_SKU,
	INITIAL_PLACEMENTS,
	SHELF_SKUS,
	SPRINTER_144,
} from '../assets/src/data/placeholder';

describe( 'fitment engine', () => {
	it( 'finds an open placement after existing components', () => {
		const wall = SPRINTER_144.walls[ 0 ]!;
		const spot = findOpenPlacement(
			SHELF_SKUS[ 0 ]!,
			wall,
			INITIAL_PLACEMENTS,
			COMPONENTS_BY_SKU
		);
		expect( spot ).not.toBeNull();
		expect( spot!.x ).toBeGreaterThan( 0 );
	} );

	it( 'flags an incompatible wall', () => {
		const wall = SPRINTER_144.walls.find( ( w ) => w.id === 'rear' )!;
		const issues = validatePlacement(
			{
				id: 'p-test',
				sku: 'SLT-SHELF-60',
				wall: 'rear',
				position: { x: 0, y: 0 },
			},
			COMPONENTS_BY_SKU[ 'SLT-SHELF-60' ]!,
			wall,
			[],
			COMPONENTS_BY_SKU
		);
		expect( issues.some( ( i ) => i.code === 'incompatible_wall' ) ).toBe(
			true
		);
	} );

	it( 'computes wall usage and payload', () => {
		const usage = calculateWallUsage(
			SPRINTER_144,
			INITIAL_PLACEMENTS,
			COMPONENTS_BY_SKU
		);
		expect( usage.length ).toBe( SPRINTER_144.walls.length );

		const payload = calculatePayload(
			SPRINTER_144,
			INITIAL_PLACEMENTS,
			COMPONENTS_BY_SKU
		);
		expect( payload.componentWeight ).toBeGreaterThan( 0 );
	} );

	it( 'builds a versioned normalized payload', () => {
		const payload = buildNormalizedPayload( {
			configurationId: null,
			vehicle: SPRINTER_144,
			activeWall: 'driver',
			placements: INITIAL_PLACEMENTS,
			componentsBySku: COMPONENTS_BY_SKU,
			dealerNotes: 'test',
		} );
		expect( payload.schema_version ).toBe( '1.0' );
		expect( payload.placements.length ).toBe( INITIAL_PLACEMENTS.length );
		expect( payload.dealer_notes ).toBe( 'test' );
	} );
} );
