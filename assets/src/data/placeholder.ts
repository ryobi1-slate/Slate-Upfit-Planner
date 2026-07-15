/**
 * Placeholder catalog + starting configuration for the Phase 1 shell.
 *
 * This is NOT the real catalog or the ported Claude data. It exists so the UI
 * shell and the engine boundary can be exercised end-to-end. It is replaced by
 * versioned data files + host catalog context in later phases.
 */

import type { PlannerComponent, Placement, VehicleGeometry } from '../types';

/** Sprinter 144" wheelbase, high roof — simplified envelope. */
export const SPRINTER_144: VehicleGeometry = {
	id: 'sprinter-144',
	name: 'Sprinter 144"',
	wheelbase: '144 in',
	payloadCapacity: 1500, // kg (placeholder)
	curbWeight: 2600, // kg (placeholder)
	walls: [
		{
			id: 'driver',
			label: 'Driver Wall',
			length: 3000,
			height: 1800,
		},
		{
			id: 'passenger',
			label: 'Passenger Wall',
			length: 2400,
			height: 1800,
		},
		{
			id: 'rear',
			label: 'Rear Wall',
			length: 1700,
			height: 1800,
		},
	],
};

/** Three shelf SKUs used as the starter catalog. */
export const SHELF_SKUS: PlannerComponent[] = [
	{
		sku: 'SLT-SHELF-32',
		name: 'Steel Shelf 32"',
		category: 'shelf',
		width: 810,
		height: 300,
		depth: 350,
		weight: 12,
		compatibleWalls: [ 'driver', 'passenger', 'rear' ],
		listValue: 420,
	},
	{
		sku: 'SLT-SHELF-48',
		name: 'Steel Shelf 48"',
		category: 'shelf',
		width: 1220,
		height: 300,
		depth: 350,
		weight: 16,
		compatibleWalls: [ 'driver', 'passenger' ],
		listValue: 560,
	},
	{
		sku: 'SLT-SHELF-60',
		name: 'Steel Shelf 60"',
		category: 'shelf',
		width: 1520,
		height: 300,
		depth: 400,
		weight: 21,
		compatibleWalls: [ 'driver' ],
		listValue: 690,
	},
];

/** SKU lookup for the engine. */
export const COMPONENTS_BY_SKU: Record< string, PlannerComponent > =
	Object.fromEntries( SHELF_SKUS.map( ( c ) => [ c.sku, c ] ) );

/** Two components already placed on the driver wall as a starting build. */
export const INITIAL_PLACEMENTS: Placement[] = [
	{
		id: 'placement-1',
		sku: 'SLT-SHELF-48',
		wall: 'driver',
		position: { x: 0, y: 0 },
	},
	{
		id: 'placement-2',
		sku: 'SLT-SHELF-32',
		wall: 'driver',
		position: { x: 1220, y: 0 },
	},
];
