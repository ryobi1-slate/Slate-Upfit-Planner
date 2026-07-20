/**
 * Version-controlled vehicle geometry for the planning runtime:
 * Mercedes Sprinter High Roof (144" + 170" wheelbases).
 *
 * Source of truth: Westcan "Mercedes Sprinter + Metris Aluminum Product Guide"
 * zone letters (A..L), resolved to along-wall inch spans here. Numbers are
 * based on one internally consistent Westcan zone model per vehicle.
 *
 *   H  partition zone (front reserve)      = 7.5"  → 8"
 *   B  van depth (interior width)          = 61.125" → 61"
 *   I  available cargo (partition→rear)     ≈ 116.4" (144 HR)
 *   K  partition→wheel-well                 = 63.1" (144 HR)
 *   E  wheel-well length                    = 36.5"
 *   G  side (sliding) door opening          = 51.75" → 52"
 *   L  contoured partition inset (passenger)= 12.125" → 12", 5" stay-clear
 *
 * Driver wall: partition + wheel well (no side door).
 * Passenger (curb) wall: partition + contoured inset + sliding door + wheel well.
 *
 * This is NOT WordPress-editable — it is fixed engineering data.
 */

import type { VehicleGeometry, WallGeometry, WallId } from '../types';

/** Wheel-well intrusion depth: (width − wheelhouseWidth)/2 for 2500 = ~4". */
const WHEEL_DEPTH = 4;

export const PLANNING_GEOMETRY_WARNING =
	'Planning dimensions — verify final fitment before installation.';

/**
 * Driver wall — partition reserve + wheel well, no side door.
 * @param length
 * @param wheelWellFrom
 * @param wheelWellTo
 */
function driverWall(
	length: number,
	wheelWellFrom: number,
	wheelWellTo: number
): WallGeometry {
	return {
		wall: 'driver',
		label: 'Driver Wall',
		length,
		partition: 8,
		blockedZones: [
			{ kind: 'partition', from: 0, to: 8, reason: 'Partition zone' },
		],
		doorZones: [],
		wheelWells: [
			{
				from: wheelWellFrom,
				to: wheelWellTo,
				depth: WHEEL_DEPTH,
				reason: 'Wheel well',
			},
		],
	};
}

/**
 * Passenger (curb) wall — partition + contoured inset + sliding door + well.
 * @param length
 * @param wheelWellFrom
 * @param wheelWellTo
 */
function passengerWall(
	length: number,
	wheelWellFrom: number,
	wheelWellTo: number
): WallGeometry {
	return {
		wall: 'passenger',
		label: 'Passenger Wall',
		length,
		partition: 8,
		blockedZones: [
			{ kind: 'partition', from: 0, to: 8, reason: 'Partition zone' },
			{
				kind: 'no-mount',
				from: 8,
				to: 20,
				reason: 'Contoured partition · 5" stay-clear',
				inset: 5,
			},
		],
		doorZones: [ { from: 8, to: 60, reason: 'Sliding door opening' } ],
		wheelWells: [
			{
				from: wheelWellFrom,
				to: wheelWellTo,
				depth: WHEEL_DEPTH,
				reason: 'Wheel well',
			},
		],
	};
}

/** Sprinter 144" WB High Roof (default demo vehicle). */
export const SPRINTER_144_HR: VehicleGeometry = {
	id: 'sprinter-144-high-roof',
	name: 'Sprinter · 144" WB High Roof',
	roof: 'high',
	wheelbase: '144"',
	length: 124,
	width: 61,
	payloadCapacity: null,
	walls: [ driverWall( 124, 71, 107 ), passengerWall( 124, 71, 107 ) ],
};

/**
 * Sprinter 170" WB High Roof. Exact Westcan values retained for provenance:
 * partition zone 7.5", sliding-door opening 51.75", door-to-wheel-well zone
 * 37.3125", wheel-well length 36.5", post-wheel-well zone 31.3125", and
 * available cargo after partition 156.875".
 *
 * The whole-inch runtime chain is rounded as one internally consistent model:
 * partition ends 8, door ends 60, wheel well 97→133, rear boundary 164.
 */
export const SPRINTER_170_HR: VehicleGeometry = {
	id: 'sprinter-170-high-roof',
	name: 'Sprinter · 170" WB High Roof',
	roof: 'high',
	wheelbase: '170"',
	length: 164,
	width: 61,
	payloadCapacity: null,
	walls: [ driverWall( 164, 97, 133 ), passengerWall( 164, 97, 133 ) ],
};

/** Runtime-supported planning vehicles. Default is the 144 High Roof. */
export const VEHICLES: VehicleGeometry[] = [ SPRINTER_144_HR, SPRINTER_170_HR ];

export function getVehicle( vehicleId: string ): VehicleGeometry | undefined {
	return VEHICLES.find( ( vehicle ) => vehicle.id === vehicleId );
}

/**
 * Resolve a wall's geometry by id.
 * @param vehicle
 * @param wall
 */
export function getWall(
	vehicle: VehicleGeometry,
	wall: WallId
): WallGeometry | undefined {
	return vehicle.walls.find( ( w ) => w.wall === wall );
}
