/**
 * Payload / weight and normalized-payload assembly. Pure functions only.
 */

import {
	SCHEMA_VERSION,
	type ConfigurationPayload,
	type FitmentIssue,
	type PayloadSummary,
	type Placement,
	type PlannerComponent,
	type Totals,
	type VehicleGeometry,
	type WallId,
} from '../types';
import { calculateWallUsage } from './geometry';
import { validateConfiguration } from './fitment';

/**
 * Compute the payload/weight summary for the current build.
 * @param vehicle
 * @param placements
 * @param componentsBySku
 */
export function calculatePayload(
	vehicle: VehicleGeometry,
	placements: Placement[],
	componentsBySku: Record< string, PlannerComponent >
): PayloadSummary {
	const componentWeight = placements.reduce(
		( sum, p ) => sum + ( componentsBySku[ p.sku ]?.weight ?? 0 ),
		0
	);

	// payloadCapacity is the weight the chassis can carry on top of its curb
	// weight, so remaining payload is capacity minus placed component weight.
	const remaining = vehicle.payloadCapacity - componentWeight;

	return {
		componentWeight,
		curbWeight: vehicle.curbWeight,
		capacity: vehicle.payloadCapacity,
		remaining,
		overCapacity: remaining < 0,
	};
}

/**
 * Sum the placeholder catalog value of all placed components. Real pricing is
 * owned by the host — this is only a package-value indicator for the UI.
 * @param placements
 * @param componentsBySku
 */
export function calculatePackageValue(
	placements: Placement[],
	componentsBySku: Record< string, PlannerComponent >
): number {
	return placements.reduce(
		( sum, p ) => sum + ( componentsBySku[ p.sku ]?.listValue ?? 0 ),
		0
	);
}

/**
 * Compute all aggregate totals for the build sheet.
 * @param vehicle
 * @param placements
 * @param componentsBySku
 */
export function calculateTotals(
	vehicle: VehicleGeometry,
	placements: Placement[],
	componentsBySku: Record< string, PlannerComponent >
): Totals {
	return {
		wallUsage: calculateWallUsage( vehicle, placements, componentsBySku ),
		payload: calculatePayload( vehicle, placements, componentsBySku ),
		packageValue: calculatePackageValue( placements, componentsBySku ),
	};
}

/**
 * Assemble the versioned normalized payload for save / quote handoff. Runs
 * validation and totals so the emitted payload is self-describing.
 * @param input
 * @param input.configurationId
 * @param input.vehicle
 * @param input.activeWall
 * @param input.placements
 * @param input.componentsBySku
 * @param input.dealerNotes
 */
export function buildNormalizedPayload( input: {
	configurationId: string | null;
	vehicle: VehicleGeometry;
	activeWall: WallId | null;
	placements: Placement[];
	componentsBySku: Record< string, PlannerComponent >;
	dealerNotes?: string;
} ): ConfigurationPayload {
	const {
		configurationId,
		vehicle,
		activeWall,
		placements,
		componentsBySku,
		dealerNotes = '',
	} = input;

	const validation: FitmentIssue[] = validateConfiguration(
		vehicle,
		placements,
		componentsBySku
	);
	const totals = calculateTotals( vehicle, placements, componentsBySku );

	return {
		schema_version: SCHEMA_VERSION,
		configuration_id: configurationId,
		vehicle: {
			id: vehicle.id,
			name: vehicle.name,
			wheelbase: vehicle.wheelbase,
			wall: activeWall,
		},
		placements: placements.map( ( p ) => ( {
			id: p.id,
			sku: p.sku,
			wall: p.wall,
			position: p.position,
		} ) ),
		infrastructure: [],
		exterior_equipment: [],
		validation: validation.map( ( issue ) => ( {
			code: issue.code,
			severity: issue.severity,
			message: issue.message,
			placement_id: issue.placementId,
		} ) ),
		totals: {
			wall_usage: { walls: totals.wallUsage },
			payload: { ...totals.payload },
			package_value: totals.packageValue,
		},
		dealer_notes: dealerNotes,
	};
}
