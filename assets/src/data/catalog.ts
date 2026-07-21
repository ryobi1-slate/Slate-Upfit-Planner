/**
 * Runtime-approved Westcan high-roof shelving. Installed dimensions come from
 * the Westcan Sprinter product guide; unavailable source weights remain null.
 */

import type { PlannerComponent, Placement } from '../types';

function shelf( sku: string, length: number ): PlannerComponent {
	return {
		sku,
		name: `Westcan 3-Shelf Unit · ${ length }" · 62" H`,
		category: 'shelf',
		length,
		depth: 16.125,
		height: 62,
		weight: null,
		tiers: 3,
		compatibleWalls: [ 'driver', 'passenger' ],
		compatibleVehicleIds: [
			'sprinter-144-high-roof',
			'sprinter-170-high-roof',
		],
		compatibleRoof: [ 'high' ],
	};
}

/** The five fixed shelves: 24 / 36 / 48 / 60 / 72 inch (Westcan 62" H, 3-tier). */
export const SHELVES: PlannerComponent[] = [
	shelf( '22-3436', 24 ),
	shelf( '22-3437', 36 ),
	shelf( '22-3438', 48 ),
	shelf( '22-3439', 60 ),
	shelf( '22-3440', 72 ),
];

/** SKU lookup for the engine. */
export const COMPONENTS_BY_SKU: Record< string, PlannerComponent > =
	Object.fromEntries( SHELVES.map( ( c ) => [ c.sku, c ] ) );

/** New planner sessions intentionally start with an empty layout. */
export const INITIAL_PLACEMENTS: Placement[] = [];
