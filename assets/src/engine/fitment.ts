/**
 * Fitment validation. Pure functions only. Phase 1 implements a small set of
 * representative rules; the full rule set is ported later behind this boundary.
 */

import type {
	FitmentIssue,
	Placement,
	PlannerComponent,
	VehicleGeometry,
	WallGeometry,
} from '../types';

/**
 * Validate a single proposed placement against a wall's geometry and existing
 * placements. Returns the issues that placement would introduce (empty === ok).
 * @param placement
 * @param component
 * @param wall
 * @param existing
 * @param componentsBySku
 */
export function validatePlacement(
	placement: Placement,
	component: PlannerComponent,
	wall: WallGeometry,
	existing: Placement[],
	componentsBySku: Record< string, PlannerComponent >
): FitmentIssue[] {
	const issues: FitmentIssue[] = [];

	if ( ! component.compatibleWalls.includes( placement.wall ) ) {
		issues.push( {
			code: 'incompatible_wall',
			severity: 'error',
			message: `${ component.name } cannot mount on the ${ placement.wall } wall.`,
			placementId: placement.id,
		} );
	}

	const right = placement.position.x + component.width;
	if ( right > wall.length ) {
		issues.push( {
			code: 'exceeds_wall_length',
			severity: 'error',
			message: `${ component.name } extends beyond the usable wall length.`,
			placementId: placement.id,
		} );
	}

	const top = placement.position.y + component.height;
	if ( top > wall.height ) {
		issues.push( {
			code: 'exceeds_wall_height',
			severity: 'error',
			message: `${ component.name } extends beyond the usable wall height.`,
			placementId: placement.id,
		} );
	}

	// Simple overlap check against same-wall placements.
	for ( const other of existing ) {
		if ( other.id === placement.id || other.wall !== placement.wall ) {
			continue;
		}
		const otherComponent = componentsBySku[ other.sku ];
		if ( ! otherComponent ) {
			continue;
		}
		const overlapsX =
			placement.position.x < other.position.x + otherComponent.width &&
			placement.position.x + component.width > other.position.x;
		if ( overlapsX ) {
			issues.push( {
				code: 'overlap',
				severity: 'warning',
				message: `${ component.name } overlaps ${ otherComponent.name }.`,
				placementId: placement.id,
			} );
			break;
		}
	}

	return issues;
}

/**
 * Validate an entire configuration by running placement validation across all
 * placements. Convenience wrapper used when building the normalized payload.
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
		vehicle.walls.map( ( w ) => [ w.id, w ] )
	);

	return placements.flatMap( ( placement ) => {
		const component = componentsBySku[ placement.sku ];
		const wall = wallsById[ placement.wall ];
		if ( ! component || ! wall ) {
			return [
				{
					code: 'unknown_reference',
					severity: 'error' as const,
					message:
						'Placement references an unknown component or wall.',
					placementId: placement.id,
				},
			];
		}
		return validatePlacement(
			placement,
			component,
			wall,
			placements,
			componentsBySku
		);
	} );
}
