/**
 * Payload / weight and normalized-payload assembly. Pure functions only.
 *
 * Phase 2 keeps the driver/passenger weight-sum core of the reference
 * `computePayload()`; roof/rear centre-of-gravity bias and infrastructure
 * weight deltas are out of Phase 2 scope.
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
	let componentWeight = 0;
	let driverWeight = 0;
	let passengerWeight = 0;

	for ( const p of placements ) {
		const w = componentsBySku[ p.sku ]?.weight ?? 0;
		componentWeight += w;
		if ( p.wall === 'driver' ) {
			driverWeight += w;
		} else if ( p.wall === 'passenger' ) {
			passengerWeight += w;
		}
	}

	// payloadCapacity is the weight the chassis can carry over curb weight, so
	// remaining payload is capacity minus placed component weight.
	const remaining = vehicle.payloadCapacity - componentWeight;

	return {
		componentWeight,
		capacity: vehicle.payloadCapacity,
		remaining,
		overCapacity: remaining < 0,
		driverWeight,
		passengerWeight,
	};
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
		// Pricing is host-owned; no package value in standalone Phase 2.
		packageValue: null,
	};
}

/**
 * Assemble the versioned normalized payload for save / quote handoff. Runs
 * validation and totals so the emitted payload is self-describing. Coordinates
 * are engineering inches — never pixels.
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
