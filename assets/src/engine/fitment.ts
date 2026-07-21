/**
 * Fitment validation. Pure functions only — no React. Ported from the reference
 * `issues()` constraint engine in App.jsx, with stable typed codes.
 *
 * Rules enforced:
 *   - vehicle/wall compatibility (INCOMPATIBLE_VEHICLE / INCOMPATIBLE_WALL)
 *   - front/partition boundary (STARTS_IN_PARTITION)
 *   - rear boundary (EXCEEDS_CARGO)
 *   - no-mount zones (BLOCKED_ZONE)
 *   - sliding-door opening (DOOR_CONFLICT)
 *   - wheel-well endpoints, SOFT (WHEEL_WELL_START / WHEEL_WELL_END, warnings)
 *   - shelf overlap (SHELF_COLLISION)
 */

import { getPlacementBounds, overlaps } from './geometry';
import type {
	FitmentIssue,
	FitmentResult,
	Placement,
	PlannerComponent,
	VehicleGeometry,
	WallGeometry,
} from '../types';

/**
 * Roll a list of issues into a single result (worst severity wins).
 * @param issues
 */
export function toFitmentResult( issues: FitmentIssue[] ): FitmentResult {
	const hasError = issues.some( ( i ) => i.severity === 'error' );
	const hasWarning = issues.some( ( i ) => i.severity === 'warning' );
	let severity: FitmentResult[ 'severity' ] = 'ok';
	if ( hasError ) {
		severity = 'error';
	} else if ( hasWarning ) {
		severity = 'warning';
	}
	return { ok: ! hasError, severity, issues };
}

/**
 * Validate a single placement against a wall's geometry, the vehicle, and the
 * other placements. Returns the issues it introduces (empty === clean).
 * @param placement
 * @param component
 * @param vehicle
 * @param wall
 * @param placements
 * @param componentsBySku
 */
export function validatePlacement(
	placement: Placement,
	component: PlannerComponent,
	vehicle: VehicleGeometry,
	wall: WallGeometry,
	placements: Placement[],
	componentsBySku: Record< string, PlannerComponent >
): FitmentIssue[] {
	const issues: FitmentIssue[] = [];
	const { start, end } = getPlacementBounds( placement, component );

	// Compatibility ----------------------------------------------------------
	if ( ! component.compatibleVehicleIds?.includes( vehicle.id ) ) {
		issues.push( {
			code: 'INCOMPATIBLE_VEHICLE',
			severity: 'error',
			message: `${ component.name } is not approved for ${ vehicle.name }.`,
			placementId: placement.id,
		} );
	}
	if (
		component.compatibleRoof.length > 0 &&
		! component.compatibleRoof.includes( vehicle.roof )
	) {
		issues.push( {
			code: 'INCOMPATIBLE_VEHICLE',
			severity: 'error',
			message: `${ component.name } does not fit a ${ vehicle.roof }-roof ${ vehicle.name }.`,
			placementId: placement.id,
		} );
	}
	if ( ! component.compatibleWalls.includes( placement.wall ) ) {
		issues.push( {
			code: 'INCOMPATIBLE_WALL',
			severity: 'error',
			message: `${ component.name } cannot mount on the ${ placement.wall } wall.`,
			placementId: placement.id,
		} );
	}

	// Boundaries -------------------------------------------------------------
	if ( start < wall.partition ) {
		issues.push( {
			code: 'STARTS_IN_PARTITION',
			severity: 'error',
			message: `Starts inside the partition zone (0–${ wall.partition }").`,
			placementId: placement.id,
			range: [ start, Math.min( end, wall.partition ) ],
		} );
	}
	if ( end > wall.length ) {
		issues.push( {
			code: 'EXCEEDS_CARGO',
			severity: 'error',
			message: `Extends past the rear doors (cargo ends at ${ wall.length }").`,
			placementId: placement.id,
			range: [ Math.max( start, wall.length ), end ],
		} );
	}

	// No-mount zones ---------------------------------------------------------
	for ( const z of wall.blockedZones ) {
		if ( z.kind === 'partition' ) {
			continue; // covered by STARTS_IN_PARTITION
		}
		if ( overlaps( start, end, z.from, z.to ) ) {
			issues.push( {
				code: 'BLOCKED_ZONE',
				severity: 'error',
				message: `Overlaps ${ z.reason.toLowerCase() } (${ z.from }–${
					z.to
				}").`,
				placementId: placement.id,
				range: [ Math.max( start, z.from ), Math.min( end, z.to ) ],
			} );
		}
	}

	// Sliding door -----------------------------------------------------------
	for ( const d of wall.doorZones ) {
		if ( overlaps( start, end, d.from, d.to ) ) {
			issues.push( {
				code: 'DOOR_CONFLICT',
				severity: 'error',
				message: `Blocks the sliding door (${ d.from }–${ d.to }").`,
				placementId: placement.id,
				range: [ Math.max( start, d.from ), Math.min( end, d.to ) ],
			} );
		}
	}

	// Wheel wells — SOFT: a shelf may span one; only its endpoints can't land in
	for ( const w of wall.wheelWells ) {
		if ( start > w.from && start < w.to ) {
			issues.push( {
				code: 'WHEEL_WELL_START',
				severity: 'warning',
				message: `Front edge lands on a wheel well (${ w.from }–${ w.to }").`,
				placementId: placement.id,
				range: [ start, Math.min( end, w.to ) ],
			} );
		}
		if ( end > w.from && end < w.to ) {
			issues.push( {
				code: 'WHEEL_WELL_END',
				severity: 'warning',
				message: `Back edge lands on a wheel well (${ w.from }–${ w.to }").`,
				placementId: placement.id,
				range: [ Math.max( start, w.from ), end ],
			} );
		}
	}

	// Shelf-to-shelf overlap on the same wall --------------------------------
	for ( const other of placements ) {
		if ( other.id === placement.id || other.wall !== placement.wall ) {
			continue;
		}
		const oc = componentsBySku[ other.sku ];
		if ( ! oc ) {
			continue;
		}
		const oStart = other.position.x;
		const oEnd = oStart + oc.length;
		if ( overlaps( start, end, oStart, oEnd ) ) {
			issues.push( {
				code: 'SHELF_COLLISION',
				severity: 'error',
				message: `Overlaps ${ oc.name } (${ oStart }–${ oEnd }").`,
				placementId: placement.id,
				range: [ Math.max( start, oStart ), Math.min( end, oEnd ) ],
			} );
		}
	}

	return issues;
}

/**
 * Validate one placement and roll up to a FitmentResult.
 * @param placement
 * @param component
 * @param vehicle
 * @param wall
 * @param placements
 * @param componentsBySku
 */
export function checkPlacement(
	placement: Placement,
	component: PlannerComponent,
	vehicle: VehicleGeometry,
	wall: WallGeometry,
	placements: Placement[],
	componentsBySku: Record< string, PlannerComponent >
): FitmentResult {
	return toFitmentResult(
		validatePlacement(
			placement,
			component,
			vehicle,
			wall,
			placements,
			componentsBySku
		)
	);
}

/**
 * Validate every placement in a configuration.
 * @param vehicle
 * @param placements
 * @param componentsBySku
 */
export function validateConfiguration(
	vehicle: VehicleGeometry,
	placements: Placement[],
	componentsBySku: Record< string, PlannerComponent >
): FitmentIssue[] {
	const wallsById = Object.fromEntries(
		vehicle.walls.map( ( w ) => [ w.wall, w ] )
	);

	return placements.flatMap( ( placement ) => {
		const component = componentsBySku[ placement.sku ];
		const wall = wallsById[ placement.wall ];
		if ( ! component ) {
			return [
				{
					code: 'UNKNOWN_COMPONENT' as const,
					severity: 'error' as const,
					message: `Placement references unknown SKU ${ placement.sku }.`,
					placementId: placement.id,
				},
			];
		}
		if ( ! wall ) {
			return [
				{
					code: 'INCOMPATIBLE_VEHICLE' as const,
					severity: 'error' as const,
					message: 'Placement references an unknown wall.',
					placementId: placement.id,
				},
			];
		}
		return validatePlacement(
			placement,
			component,
			vehicle,
			wall,
			placements,
			componentsBySku
		);
	} );
}
