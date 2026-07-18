/**
 * Version-controlled vehicle geometry for the Phase 2 production slice:
 * Mercedes Sprinter High Roof (144" + 170" wheelbases).
 *
 * Source of truth: Westcan "Mercedes Sprinter + Metris Aluminum Product Guide"
 * zone letters (A..L), resolved to along-wall inch spans here. Numbers are
 * derived from the reference `mkVan()` for the 144" chassis with the 2500/RWD
 * chassis (payload 4211 lb, wheelhouse width 53").
 *
 *   H  partition zone (front reserve)      = 7.5"  → 8"
 *   B  van depth (interior width)          = 61.125" → 61"
 *   I  available cargo (partition→rear)     ≈ 116.4" (HR) / 117.1" (STD)
 *   K  partition→wheel-well                 = 63.1" (HR) / 63.6" (STD)
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

/**
 * Driver wall — partition reserve + wheel well, no side door.
 * @param length
 * @param wheelWellTo
 */
function driverWall( length: number, wheelWellTo: number ): WallGeometry {
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
				from: 71,
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
 * @param wheelWellTo
 */
function passengerWall( length: number, wheelWellTo: number ): WallGeometry {
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
				from: 71,
				to: wheelWellTo,
				depth: WHEEL_DEPTH,
				reason: 'Wheel well',
			},
		],
	};
}

/** Sprinter 144" WB High Roof (default demo vehicle). */
export const SPRINTER_144_HR: VehicleGeometry = {
	id: 'sprinter-144-hr',
	name: 'Sprinter · 144" WB High Roof',
	roof: 'high',
	wheelbase: '144"',
	length: 124,
	width: 61,
	payloadCapacity: 4211,
	payloadRequiresVin: true,
	walls: [ driverWall( 124, 107 ), passengerWall( 124, 107 ) ],
};

/**
 * Sprinter 170" WB High Roof. Westcan's 156.875" available cargo run is
 * rounded to 157" and combined with the existing 8" partition reserve. The
 * 51.75" door, 37.3125" pre-wheel run, 36.5" wheel well, and 31.3125" rear
 * run are rounded to the whole-inch runtime grid used by this module.
 */
export const SPRINTER_170_HR: VehicleGeometry = {
	id: 'sprinter-170-hr',
	name: 'Sprinter · 170" WB High Roof',
	roof: 'high',
	wheelbase: '170"',
	length: 165,
	width: 61,
	payloadCapacity: 4211,
	payloadRequiresVin: true,
	walls: [ driverWall( 165, 133 ), passengerWall( 165, 133 ) ].map(
		( wall ) => ( {
			...wall,
			wheelWells: wall.wheelWells.map( ( well ) => ( {
				...well,
				from: 96,
			} ) ),
			doorZones:
				wall.wall === 'passenger'
					? [ { from: 8, to: 60, reason: 'Sliding door opening' } ]
					: [],
		} )
	),
};

/** Sprinter 144" WB Standard Roof (same walls; taller shelves don't fit). */
export const SPRINTER_144_STD: VehicleGeometry = {
	id: 'sprinter-144-std',
	name: 'Sprinter · 144" WB Standard Roof',
	roof: 'standard',
	wheelbase: '144"',
	length: 125,
	width: 61,
	payloadCapacity: 4211,
	walls: [ driverWall( 125, 108 ), passengerWall( 125, 108 ) ],
};

/** All Phase 2 vehicles. Default is the High Roof. */
export const VEHICLES: VehicleGeometry[] = [ SPRINTER_144_HR, SPRINTER_170_HR ];

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
