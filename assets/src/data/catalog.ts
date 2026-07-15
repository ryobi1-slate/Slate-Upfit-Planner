/**
 * Fixed Phase 2 shelf catalog — a small slice of real Westcan high-roof
 * shelving (62" H, 3-tier) in five lengths. Dimensions and SKUs come from the
 * Westcan product guide; pricing is intentionally omitted in Phase 2 (host owns
 * pricing).
 *
 * Replaced by REST/host catalog hydration in a later phase.
 */

import type { PlannerComponent, Placement } from '../types';

/**
 * Weight model from the reference: round(length·1.7 + tiers·14), tiers = 3.
 * @param length
 */
function shelfWeight( length: number ): number {
	return Math.round( length * 1.7 + 3 * 14 );
}

function shelf( sku: string, length: number ): PlannerComponent {
	return {
		sku,
		name: `3-Shelf Unit · ${ length }" · 62" H`,
		category: 'shelf',
		length,
		depth: 16.125,
		height: 62,
		weight: shelfWeight( length ),
		tiers: 3,
		compatibleWalls: [ 'driver', 'passenger' ],
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

/**
 * Starting build for the demo — mirrors the reference sample layout using
 * in-catalog SKUs. All three placements are legal on the High Roof geometry:
 * driver 12→60 and 62→110 (spans the wheel well; endpoints clear), passenger
 * 62→110 (clears the sliding door at 8→60).
 */
export const INITIAL_PLACEMENTS: Placement[] = [
	{
		id: 'placement-1',
		sku: '22-3438',
		wall: 'driver',
		position: { x: 12, y: 0 },
	},
	{
		id: 'placement-2',
		sku: '22-3438',
		wall: 'driver',
		position: { x: 62, y: 0 },
	},
	{
		id: 'placement-3',
		sku: '22-3438',
		wall: 'passenger',
		position: { x: 62, y: 0 },
	},
];
