/**
 * Geometry helpers for the fitment engine. Pure functions only — no React, no
 * DOM. All coordinates are inches along the wall, measured from the front of
 * the cargo area.
 *
 * Ported from the reference `findSpot()` / drag-clamp logic in App.jsx and
 * VanCanvas(H).jsx, generalized to typed driver/passenger walls.
 */

import { SNAP_INCREMENT } from '../types';
import type {
	Inches,
	MountZone,
	Placement,
	PlacementBounds,
	PlannerComponent,
	VehicleGeometry,
	WallGeometry,
	WallId,
	WallUsage,
} from '../types';

/**
 * Along-wall [start,end] span for a placement.
 * @param placement
 * @param component
 */
export function getPlacementBounds(
	placement: Placement,
	component: PlannerComponent
): PlacementBounds {
	const start = placement.position.x;
	return { wall: placement.wall, start, end: start + component.length };
}

/**
 * True when two along-wall ranges overlap (touching at an edge does not).
 * @param aStart
 * @param aEnd
 * @param bStart
 * @param bEnd
 */
export function overlaps(
	aStart: Inches,
	aEnd: Inches,
	bStart: Inches,
	bEnd: Inches
): boolean {
	return ! ( aEnd <= bStart || aStart >= bEnd );
}

/**
 * Hard keep-out spans for a wall (partition, no-mount, sliding door, and every
 * other placed component on the same wall). Wheel wells are NOT included — they
 * are soft (handled separately as an endpoint rule).
 * @param wall
 * @param placements
 * @param componentsBySku
 * @param excludePlacementId
 */
export function getHardBlocks(
	wall: WallGeometry,
	placements: Placement[],
	componentsBySku: Record< string, PlannerComponent >,
	excludePlacementId?: string
): Array< [ Inches, Inches ] > {
	const blocks: Array< [ Inches, Inches ] > = [];

	for ( const z of wall.blockedZones ) {
		blocks.push( [ z.from, z.to ] );
	}
	for ( const d of wall.doorZones ) {
		blocks.push( [ d.from, d.to ] );
	}
	for ( const p of placements ) {
		if ( p.wall !== wall.wall || p.id === excludePlacementId ) {
			continue;
		}
		const c = componentsBySku[ p.sku ];
		if ( ! c ) {
			continue;
		}
		blocks.push( [ p.position.x, p.position.x + c.length ] );
	}
	return blocks;
}

/**
 * True when a component's along-wall span hits any hard block.
 * @param start
 * @param end
 * @param blocks
 */
export function intersectsBlockedZone(
	start: Inches,
	end: Inches,
	blocks: Array< [ Inches, Inches ] >
): boolean {
	return blocks.some( ( [ from, to ] ) => overlaps( start, end, from, to ) );
}

/**
 * True when an inch position lands strictly inside a wheel well (soft rule).
 * @param pos
 * @param wall
 */
export function edgeInsideWheelWell(
	pos: Inches,
	wall: WallGeometry
): boolean {
	return wall.wheelWells.some( ( w ) => pos > w.from && pos < w.to );
}

/**
 * Snap a value to the nearest increment (default 1").
 * @param value
 * @param increment
 */
export function snapToIncrement(
	value: Inches,
	increment: Inches = SNAP_INCREMENT
): Inches {
	return Math.round( value / increment ) * increment;
}

/**
 * Clamp an along-wall position so the component stays between the partition and
 * the rear boundary. Returns a snapped, in-bounds inch position.
 * @param position
 * @param component
 * @param wall
 */
export function clampPlacement(
	position: Inches,
	component: PlannerComponent,
	wall: WallGeometry
): Inches {
	const min = wall.partition;
	const max = Math.max( min, wall.length - component.length );
	return Math.max( min, Math.min( max, snapToIncrement( position ) ) );
}

/**
 * Find the first legal 1"-increment position for a component on a wall.
 * Scans from the partition to the rear; skips hard blocks and positions whose
 * leading/trailing edge would land inside a wheel well. Returns null if nothing
 * fits. Mirrors the reference `findSpot()`.
 * @param component
 * @param wall
 * @param placements
 * @param componentsBySku
 */
export function findOpenPlacement(
	component: PlannerComponent,
	wall: WallGeometry,
	placements: Placement[],
	componentsBySku: Record< string, PlannerComponent >
): { x: Inches; y: Inches } | null {
	if ( ! component.compatibleWalls.includes( wall.wall ) ) {
		return null;
	}
	const blocks = getHardBlocks( wall, placements, componentsBySku );

	for (
		let pos = wall.partition;
		pos + component.length <= wall.length;
		pos += SNAP_INCREMENT
	) {
		const end = pos + component.length;
		if ( intersectsBlockedZone( pos, end, blocks ) ) {
			continue;
		}
		if (
			edgeInsideWheelWell( pos, wall ) ||
			edgeInsideWheelWell( end, wall )
		) {
			continue;
		}
		return { x: pos, y: 0 };
	}
	return null;
}

/**
 * Contiguous open (mountable) runs on a wall, excluding hard blocks. Useful for
 * previews and remaining-space readouts. Wheel wells are not excluded (soft).
 * @param wall
 * @param placements
 * @param componentsBySku
 */
export function getOpenRuns(
	wall: WallGeometry,
	placements: Placement[],
	componentsBySku: Record< string, PlannerComponent >
): MountZone[] {
	const blocks = getHardBlocks( wall, placements, componentsBySku )
		.map( ( [ from, to ] ) => ( { from, to } ) )
		.sort( ( a, b ) => a.from - b.from );

	const runs: MountZone[] = [];
	let cursor = wall.partition;

	for ( const b of blocks ) {
		if ( b.to <= cursor ) {
			continue;
		}
		if ( b.from > cursor ) {
			runs.push( { from: cursor, to: Math.min( b.from, wall.length ) } );
		}
		cursor = Math.max( cursor, b.to );
	}
	if ( cursor < wall.length ) {
		runs.push( { from: cursor, to: wall.length } );
	}
	return runs.filter( ( r ) => r.to > r.from );
}

/**
 * Mountable length remaining on a wall (usable minus placed lengths).
 * @param wall
 * @param placements
 * @param componentsBySku
 */
export function getRemainingWallLength(
	wall: WallGeometry,
	placements: Placement[],
	componentsBySku: Record< string, PlannerComponent >
): Inches {
	const used = placements
		.filter( ( p ) => p.wall === wall.wall )
		.reduce(
			( sum, p ) => sum + ( componentsBySku[ p.sku ]?.length ?? 0 ),
			0
		);
	const usable = Math.max( 0, wall.length - wall.partition );
	return Math.max( 0, usable - used );
}

/**
 * Per-wall usage / utilization for the current placements.
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
			.filter( ( p ) => p.wall === wall.wall )
			.reduce(
				( sum, p ) => sum + ( componentsBySku[ p.sku ]?.length ?? 0 ),
				0
			);
		const usable = Math.max( 0, wall.length - wall.partition );
		const availableLength = Math.max( 0, usable - usedLength );
		const utilization = usable > 0 ? Math.min( usedLength / usable, 1 ) : 0;
		return {
			wall: wall.wall as WallId,
			usedLength,
			availableLength,
			utilization,
		};
	} );
}
