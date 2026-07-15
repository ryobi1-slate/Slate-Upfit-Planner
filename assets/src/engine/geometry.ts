/**
 * Geometry helpers for the fitment engine. Pure functions only — no React, no
 * DOM. Phase 1 provides working-but-simplified placeholders; the full Claude
 * geometry/packing logic is ported in a later phase behind this same boundary.
 */

import type {
	Millimeters,
	Placement,
	PlannerComponent,
	VehicleGeometry,
	WallGeometry,
	WallId,
	WallUsage,
} from '../types';

/**
 * Find the next open placement position for a component on a wall.
 *
 * Phase 1 strategy: naive left-to-right packing along the wall length at y=0,
 * placed after the right edge of the last same-wall placement. Returns null if
 * the component cannot fit within the wall length.
 * @param component
 * @param wall
 * @param existing
 * @param componentsBySku
 */
export function findOpenPlacement(
	component: PlannerComponent,
	wall: WallGeometry,
	existing: Placement[],
	componentsBySku: Record< string, PlannerComponent >
): { x: Millimeters; y: Millimeters } | null {
	const onWall = existing.filter( ( p ) => p.wall === wall.id );

	let cursor: Millimeters = 0;
	for ( const placement of onWall ) {
		const placed = componentsBySku[ placement.sku ];
		const right = placement.position.x + ( placed?.width ?? 0 );
		if ( right > cursor ) {
			cursor = right;
		}
	}

	if ( cursor + component.width > wall.length ) {
		return null;
	}

	return { x: cursor, y: 0 };
}

/**
 * Compute per-wall length usage / utilization for the current placements.
 * @param vehicle
 * @param placements
 * @param componentsBySku
 */
export function calculateWallUsage(
	vehicle: VehicleGeometry,
	placements: Placement[],
	componentsBySku: Record< string, PlannerComponent >
): WallUsage[] {
	return vehicle.walls.map( ( wall ) => {
		const usedLength = placements
			.filter( ( p ) => p.wall === wall.id )
			.reduce(
				( sum, p ) => sum + ( componentsBySku[ p.sku ]?.width ?? 0 ),
				0
			);

		const availableLength = Math.max( wall.length - usedLength, 0 );
		const utilization =
			wall.length > 0 ? Math.min( usedLength / wall.length, 1 ) : 0;

		return {
			wall: wall.id as WallId,
			usedLength,
			availableLength,
			utilization,
		};
	} );
}
