/**
 * Fitment engine unit tests. Run with `npm test` (wp-scripts test-unit-js).
 * Uses @jest/globals so no global type setup is needed for the typechecker.
 *
 * Covers the Phase 2 required cases: valid placement, overlap, no-mount,
 * wheel-well (soft), door, boundary, snapping, wall usage, payload, and
 * load-configuration id restoration.
 */

import { describe, it, expect } from '@jest/globals';
import {
	buildNormalizedPayload,
	calculatePayload,
	calculateWallUsage,
	clampPlacement,
	findOpenPlacement,
	snapToIncrement,
	validatePlacement,
} from '../assets/src/engine';
import { initPlannerState, plannerReducer } from '../assets/src/state/reducer';
import {
	loadConfiguration,
	selectVehicle,
} from '../assets/src/state/actions';
import {
	getVehicle,
	getWall,
	PLANNING_GEOMETRY_WARNING,
	SPRINTER_144_HR,
	SPRINTER_170_HR,
	VEHICLES,
} from '../assets/src/data/geometry';
import { resolveSupportedVehicle } from '../assets/src/hooks/usePlanner';
import {
	COMPONENTS_BY_SKU,
	INITIAL_PLACEMENTS,
} from '../assets/src/data/catalog';
import type { Placement } from '../assets/src/types';

const vehicle = SPRINTER_144_HR;
const driver = getWall( vehicle, 'driver' )!;
const passenger = getWall( vehicle, 'passenger' )!;
const shelf48 = COMPONENTS_BY_SKU[ '22-3438' ]!;

function place(
	id: string,
	sku: string,
	wall: 'driver' | 'passenger',
	x: number
): Placement {
	return { id, sku, wall, position: { x, y: 0 } };
}

describe( 'runtime vehicle registry', () => {
	it( 'contains only canonical 144 and 170 High Roof records', () => {
		expect( VEHICLES ).toHaveLength( 2 );
		expect( VEHICLES.map( ( option ) => option.id ) ).toEqual( [
			'sprinter-144-high-roof',
			'sprinter-170-high-roof',
		] );
		expect( VEHICLES.every( ( option ) => option.roof === 'high' ) ).toBe(
			true
		);
	} );

	it( 'resolves only supported runtime vehicle IDs', () => {
		expect( getVehicle( 'sprinter-144-high-roof' ) ).toBe(
			SPRINTER_144_HR
		);
		expect( getVehicle( 'sprinter-170-high-roof' ) ).toBe(
			SPRINTER_170_HR
		);
		expect( getVehicle( 'unknown' ) ).toBeUndefined();
		expect( getVehicle( 'sprinter-144-standard-roof' ) ).toBeUndefined();
		expect( getVehicle( 'sprinter-170-extended-high-roof' ) ).toBeUndefined();
	} );

	it( 'exports the exact planning warning', () => {
		expect( PLANNING_GEOMETRY_WARNING ).toBe(
			'Planning dimensions — verify final fitment before installation.'
		);
	} );
} );

describe( 'runtime vehicle geometry', () => {
	it( 'keeps the established 144 High Roof coordinates', () => {
		const driverWall = getWall( SPRINTER_144_HR, 'driver' )!;
		const passengerWall = getWall( SPRINTER_144_HR, 'passenger' )!;

		expect( driverWall.partition ).toBe( 8 );
		expect( driverWall.length ).toBe( 124 );
		expect( passengerWall.doorZones[ 0 ] ).toMatchObject( {
			from: 8,
			to: 60,
		} );
		expect( driverWall.wheelWells[ 0 ] ).toMatchObject( {
			from: 71,
			to: 107,
		} );
		expect( passengerWall.wheelWells[ 0 ] ).toMatchObject( {
			from: 71,
			to: 107,
		} );
	} );

	it( 'uses the approved internally consistent 170 coordinates', () => {
		const driverWall = getWall( SPRINTER_170_HR, 'driver' )!;
		const passengerWall = getWall( SPRINTER_170_HR, 'passenger' )!;

		expect( driverWall.partition ).toBe( 8 );
		expect( driverWall.length ).toBe( 164 );
		expect( passengerWall.doorZones[ 0 ] ).toMatchObject( {
			from: 8,
			to: 60,
		} );
		expect( driverWall.wheelWells[ 0 ] ).toMatchObject( {
			from: 97,
			to: 133,
		} );
		expect( passengerWall.wheelWells[ 0 ] ).toMatchObject( {
			from: 97,
			to: 133,
		} );
	} );
} );

describe( 'geometry helpers', () => {
	it( 'snaps to the nearest inch', () => {
		expect( snapToIncrement( 12.4 ) ).toBe( 12 );
		expect( snapToIncrement( 12.6 ) ).toBe( 13 );
	} );

	it( 'clamps between partition and rear boundary', () => {
		// Below partition clamps up to 8.
		expect( clampPlacement( 2, shelf48, driver ) ).toBe( 8 );
		// Past rear (124 − 48 = 76 max) clamps down.
		expect( clampPlacement( 200, shelf48, driver ) ).toBe( 76 );
	} );

	it( 'finds a legal open placement on an empty driver wall', () => {
		const spot = findOpenPlacement(
			shelf48,
			driver,
			[],
			COMPONENTS_BY_SKU
		);
		expect( spot ).not.toBeNull();
		expect( spot!.x ).toBeGreaterThanOrEqual( driver.partition );
	} );
} );

describe( 'validatePlacement', () => {
	const clean = place( 'p1', '22-3438', 'driver', 12 ); // 12→60, legal

	it( 'accepts a valid placement (no issues)', () => {
		const issues = validatePlacement(
			clean,
			shelf48,
			vehicle,
			driver,
			[ clean ],
			COMPONENTS_BY_SKU
		);
		expect( issues ).toEqual( [] );
	} );

	it( 'rejects overlap with another shelf', () => {
		const a = place( 'a', '22-3438', 'driver', 12 ); // 12→60
		const b = place( 'b', '22-3438', 'driver', 40 ); // 40→88 overlaps a
		const issues = validatePlacement(
			b,
			shelf48,
			vehicle,
			driver,
			[ a, b ],
			COMPONENTS_BY_SKU
		);
		expect( issues.some( ( i ) => i.code === 'SHELF_COLLISION' ) ).toBe(
			true
		);
	} );

	it( 'rejects the partition (front boundary) zone', () => {
		const p = place( 'p', '22-3438', 'driver', 0 ); // starts at front
		const issues = validatePlacement(
			p,
			shelf48,
			vehicle,
			driver,
			[ p ],
			COMPONENTS_BY_SKU
		);
		expect( issues.some( ( i ) => i.code === 'STARTS_IN_PARTITION' ) ).toBe(
			true
		);
	} );

	it( 'rejects extending past the rear boundary', () => {
		const p = place( 'p', '22-3438', 'driver', 100 ); // 100→148 > 124
		const issues = validatePlacement(
			p,
			shelf48,
			vehicle,
			driver,
			[ p ],
			COMPONENTS_BY_SKU
		);
		expect( issues.some( ( i ) => i.code === 'EXCEEDS_CARGO' ) ).toBe(
			true
		);
	} );

	it( 'rejects the passenger no-mount contoured inset', () => {
		const p = place( 'p', '22-3436', 'passenger', 8 ); // 24" shelf 8→32 hits 8→20
		const issues = validatePlacement(
			p,
			COMPONENTS_BY_SKU[ '22-3436' ]!,
			vehicle,
			passenger,
			[ p ],
			COMPONENTS_BY_SKU
		);
		expect( issues.some( ( i ) => i.code === 'BLOCKED_ZONE' ) ).toBe(
			true
		);
	} );

	it( 'rejects blocking the sliding door', () => {
		const p = place( 'p', '22-3438', 'passenger', 30 ); // 30→78 hits door 8→60
		const issues = validatePlacement(
			p,
			shelf48,
			vehicle,
			passenger,
			[ p ],
			COMPONENTS_BY_SKU
		);
		expect( issues.some( ( i ) => i.code === 'DOOR_CONFLICT' ) ).toBe(
			true
		);
	} );

	it( 'flags a wheel-well endpoint as a soft warning (not an error)', () => {
		// 24" shelf starting at 80 → 80→104, front edge inside well 71→107.
		const p = place( 'p', '22-3436', 'driver', 80 );
		const issues = validatePlacement(
			p,
			COMPONENTS_BY_SKU[ '22-3436' ]!,
			vehicle,
			driver,
			[ p ],
			COMPONENTS_BY_SKU
		);
		const ww = issues.filter( ( i ) => i.code.startsWith( 'WHEEL_WELL' ) );
		expect( ww.length ).toBeGreaterThan( 0 );
		expect( ww.every( ( i ) => i.severity === 'warning' ) ).toBe( true );
	} );

	it( 'allows a shelf to SPAN a wheel well (endpoints clear)', () => {
		// 48" shelf 62→110 spans well 71→107; both endpoints outside → clean.
		const p = place( 'p', '22-3438', 'driver', 62 );
		const issues = validatePlacement(
			p,
			shelf48,
			vehicle,
			driver,
			[ p ],
			COMPONENTS_BY_SKU
		);
		expect( issues ).toEqual( [] );
	} );

	it( 'rejects a roof-incompatible vehicle', () => {
		const p = place( 'p', '22-3438', 'driver', 12 );
		const stdVehicle = { ...vehicle, roof: 'standard' as const };
		const issues = validatePlacement(
			p,
			shelf48,
			stdVehicle,
			driver,
			[ p ],
			COMPONENTS_BY_SKU
		);
		expect(
			issues.some( ( i ) => i.code === 'INCOMPATIBLE_VEHICLE' )
		).toBe( true );
	} );
} );

describe( 'Sprinter 170 High Roof fitment', () => {
	const driver170 = getWall( SPRINTER_170_HR, 'driver' )!;
	const passenger170 = getWall( SPRINTER_170_HR, 'passenger' )!;

	it( 'reports a passenger sliding-door conflict', () => {
		const placement = place( 'door', '22-3438', 'passenger', 30 );
		const issues = validatePlacement(
			placement,
			shelf48,
			SPRINTER_170_HR,
			passenger170,
			[ placement ],
			COMPONENTS_BY_SKU
		);

		expect( issues.some( ( issue ) => issue.code === 'DOOR_CONFLICT' ) ).toBe(
			true
		);
	} );

	it( 'reports a wheel-well endpoint warning', () => {
		const placement = place( 'well', '22-3436', 'driver', 100 );
		const issues = validatePlacement(
			placement,
			COMPONENTS_BY_SKU[ '22-3436' ]!,
			SPRINTER_170_HR,
			driver170,
			[ placement ],
			COMPONENTS_BY_SKU
		);

		expect(
			issues.some(
				( issue ) =>
					issue.code.startsWith( 'WHEEL_WELL' ) &&
					issue.severity === 'warning'
			)
		).toBe( true );
	} );

	it( 'reports a placement extending past the 164-inch rear boundary', () => {
		const placement = place( 'rear', '22-3438', 'driver', 130 );
		const issues = validatePlacement(
			placement,
			shelf48,
			SPRINTER_170_HR,
			driver170,
			[ placement ],
			COMPONENTS_BY_SKU
		);

		expect( issues.some( ( issue ) => issue.code === 'EXCEEDS_CARGO' ) ).toBe(
			true
		);
	} );

	it( 'accepts a legal driver-side placement', () => {
		const placement = place( 'legal', '22-3438', 'driver', 12 );

		expect(
			validatePlacement(
				placement,
				shelf48,
				SPRINTER_170_HR,
				driver170,
				[ placement ],
				COMPONENTS_BY_SKU
			)
		).toEqual( [] );
	} );
} );

describe( 'totals', () => {
	it( 'computes wall usage for both walls', () => {
		const usage = calculateWallUsage(
			vehicle,
			INITIAL_PLACEMENTS,
			COMPONENTS_BY_SKU
		);
		expect( usage.length ).toBe( 2 );
		const driverUsage = usage.find( ( u ) => u.wall === 'driver' )!;
		expect( driverUsage.usedLength ).toBe( 96 ); // two 48" shelves
	} );

	it( 'keeps VIN-dependent capacity and remaining payload unknown', () => {
		const payload = calculatePayload(
			vehicle,
			INITIAL_PLACEMENTS,
			COMPONENTS_BY_SKU
		);
		expect( payload.componentWeight ).toBe( shelf48.weight * 3 );
		expect( payload.driverWeight ).toBe( shelf48.weight * 2 );
		expect( payload.passengerWeight ).toBe( shelf48.weight );
		expect( payload.capacity ).toBeNull();
		expect( payload.remaining ).toBeNull();
		expect( payload.overCapacity ).toBe( false );
	} );

	it( 'preserves calculations for a future known numeric capacity', () => {
		const knownCapacityVehicle = { ...vehicle, payloadCapacity: 200 };
		const payload = calculatePayload(
			knownCapacityVehicle,
			INITIAL_PLACEMENTS,
			COMPONENTS_BY_SKU
		);

		expect( payload.capacity ).toBe( 200 );
		expect( payload.remaining ).toBe( 200 - shelf48.weight * 3 );
		expect( payload.overCapacity ).toBe(
			200 - shelf48.weight * 3 < 0
		);
	} );
} );

describe( 'normalized payload', () => {
	it( 'emits schema 1.0 with engineering coordinates + validation', () => {
		const payload = buildNormalizedPayload( {
			configurationId: null,
			vehicle,
			activeWall: 'driver',
			placements: INITIAL_PLACEMENTS,
			componentsBySku: COMPONENTS_BY_SKU,
			dealerNotes: 'test',
		} );
		expect( payload.schema_version ).toBe( '1.0' );
		expect( payload.placements[ 0 ]!.position ).toEqual( { x: 12, y: 0 } );
		expect( Array.isArray( payload.validation ) ).toBe( true );
		expect( payload.dealer_notes ).toBe( 'test' );
		expect( payload.totals.payload.capacity ).toBeNull();
		expect( payload.totals.payload.remaining ).toBeNull();
		expect( payload.totals.payload.componentWeight ).toBe(
			shelf48.weight * 3
		);
	} );
} );

describe( 'vehicle selection', () => {
	it( 'selects 170 through the reducer and clears the current layout', () => {
		const state = initPlannerState( {
			vehicle,
			componentsBySku: COMPONENTS_BY_SKU,
			placements: INITIAL_PLACEMENTS,
			activeWall: 'passenger',
		} );
		const next = plannerReducer( state, selectVehicle( SPRINTER_170_HR ) );

		expect( next.vehicle ).toBe( SPRINTER_170_HR );
		expect( next.activeWall ).toBe( 'driver' );
		expect( next.placements ).toEqual( [] );
	} );

	it( 'ignores an unsupported ID at the hook-level resolver boundary', () => {
		const state = initPlannerState( {
			vehicle,
			componentsBySku: COMPONENTS_BY_SKU,
			placements: INITIAL_PLACEMENTS,
			activeWall: 'passenger',
		} );
		const unsupported = resolveSupportedVehicle(
			'sprinter-170-extended-high-roof'
		);
		const next = unsupported
			? plannerReducer( state, selectVehicle( unsupported ) )
			: state;

		expect( unsupported ).toBeUndefined();
		expect( next ).toBe( state );
	} );
} );

describe( 'reducer load configuration', () => {
	it( 'restores placements and mints non-colliding ids afterward', () => {
		let state = initPlannerState( {
			vehicle,
			componentsBySku: COMPONENTS_BY_SKU,
			placements: [],
			activeWall: 'driver',
		} );
		// Load a config whose ids are non-sequential (placement-1, placement-5).
		const loaded: Placement[] = [
			place( 'placement-1', '22-3438', 'driver', 12 ),
			place( 'placement-5', '22-3438', 'driver', 62 ),
		];
		const payload = buildNormalizedPayload( {
			configurationId: 'cfg-1',
			vehicle,
			activeWall: 'driver',
			placements: loaded,
			componentsBySku: COMPONENTS_BY_SKU,
		} );
		state = plannerReducer( state, loadConfiguration( payload, loaded ) );
		expect( state.placementSeq ).toBe( 5 );
		// Next placement id must not collide with placement-5.
		state = plannerReducer( state, {
			type: 'PLACE_COMPONENT',
			sku: '22-3436',
			wall: 'passenger',
			position: { x: 62, y: 0 },
		} );
		const ids = state.placements.map( ( p ) => p.id );
		expect( new Set( ids ).size ).toBe( ids.length );
		expect( ids ).toContain( 'placement-6' );
	} );

	it( 'sanitizes a legacy/unknown restored wall to a valid one', () => {
		const state = initPlannerState( {
			vehicle,
			componentsBySku: COMPONENTS_BY_SKU,
			placements: [],
			activeWall: 'passenger',
		} );
		const payload = buildNormalizedPayload( {
			configurationId: 'cfg-legacy',
			vehicle,
			activeWall: 'driver',
			placements: [],
			componentsBySku: COMPONENTS_BY_SKU,
		} );
		// Simulate a Phase 1 payload carrying a wall id no longer valid.
		( payload.vehicle as { wall: string } ).wall = 'rear';
		const next = plannerReducer( state, loadConfiguration( payload, [] ) );
		// Falls back to the current wall instead of an unrenderable 'rear'.
		expect( next.activeWall ).toBe( 'passenger' );
	} );
} );

describe( 'interaction flow (engine + reducer, mirrors the UI hook)', () => {
	it( 'places, snaps/clamps a move, flags overlap, preserves on wall switch, removes', () => {
		let state = initPlannerState( {
			vehicle,
			componentsBySku: COMPONENTS_BY_SKU,
			placements: [],
			activeWall: 'driver',
		} );

		// 1. Select a shelf and auto-place (findOpenPlacement → dispatch).
		state = plannerReducer( state, {
			type: 'SELECT_PRODUCT',
			sku: '22-3438',
		} );
		const spot = findOpenPlacement(
			shelf48,
			driver,
			[],
			COMPONENTS_BY_SKU
		)!;
		expect( spot.x ).toBe( 8 ); // first legal inch past the partition
		state = plannerReducer( state, {
			type: 'PLACE_COMPONENT',
			sku: '22-3438',
			wall: 'driver',
			position: spot,
		} );
		const firstId = state.placements[ 0 ]!.id;

		// 2. Drag/move with 1" snap + clamp: raw 12.6" → snap 13, in-bounds.
		const moved = clampPlacement( 12.6, shelf48, driver );
		expect( moved ).toBe( 13 );
		state = plannerReducer( state, {
			type: 'MOVE_PLACEMENT',
			placementId: firstId,
			position: { x: moved, y: 0 },
		} );
		expect( state.placements[ 0 ]!.position.x ).toBe( 13 );

		// 3. Place a second shelf that overlaps → SHELF_COLLISION flagged.
		state = plannerReducer( state, {
			type: 'PLACE_COMPONENT',
			sku: '22-3438',
			wall: 'driver',
			position: { x: 40, y: 0 }, // 40→88 overlaps 13→61
		} );
		const conflicts = validatePlacement(
			state.placements[ 1 ]!,
			shelf48,
			vehicle,
			driver,
			state.placements,
			COMPONENTS_BY_SKU
		);
		expect( conflicts.some( ( i ) => i.code === 'SHELF_COLLISION' ) ).toBe(
			true
		);

		// 4. Switch wall preserves both placements.
		state = plannerReducer( state, {
			type: 'SWITCH_WALL',
			wall: 'passenger',
		} );
		expect( state.activeWall ).toBe( 'passenger' );
		expect( state.placements.length ).toBe( 2 );

		// 5. Remove the first placement; payload reflects the remaining shelf.
		state = plannerReducer( state, {
			type: 'REMOVE_PLACEMENT',
			placementId: firstId,
		} );
		expect( state.placements.length ).toBe( 1 );
		const payload = calculatePayload(
			vehicle,
			state.placements,
			COMPONENTS_BY_SKU
		);
		expect( payload.componentWeight ).toBe( shelf48.weight );
	} );
} );
