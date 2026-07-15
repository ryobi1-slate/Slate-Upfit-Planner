/**
 * Action types and creators for the planner reducer. Kept separate from the
 * reducer so components import lightweight creators without pulling reducer
 * internals.
 */

import type {
	ConfigurationPayload,
	Millimeters,
	Placement,
	VehicleGeometry,
	WallId,
} from '../types';

export type PlannerAction =
	| { type: 'SELECT_VEHICLE'; vehicle: VehicleGeometry }
	| { type: 'SELECT_WALL'; wall: WallId }
	| { type: 'SELECT_PRODUCT'; sku: string | null }
	| {
			type: 'PLACE_COMPONENT';
			sku: string;
			wall: WallId;
			position?: { x: Millimeters; y: Millimeters };
	  }
	| {
			type: 'MOVE_COMPONENT';
			placementId: string;
			position: { x: Millimeters; y: Millimeters };
			wall?: WallId;
	  }
	| { type: 'REMOVE_COMPONENT'; placementId: string }
	| {
			type: 'LOAD_CONFIGURATION';
			payload: ConfigurationPayload;
			placements: Placement[];
	  }
	| { type: 'SET_DEALER_NOTES'; notes: string }
	| { type: 'RESET_CONFIGURATION' };

export const selectVehicle = ( vehicle: VehicleGeometry ): PlannerAction => ( {
	type: 'SELECT_VEHICLE',
	vehicle,
} );

export const selectWall = ( wall: WallId ): PlannerAction => ( {
	type: 'SELECT_WALL',
	wall,
} );

export const selectProduct = ( sku: string | null ): PlannerAction => ( {
	type: 'SELECT_PRODUCT',
	sku,
} );

export const placeComponent = (
	sku: string,
	wall: WallId,
	position?: { x: Millimeters; y: Millimeters }
): PlannerAction => ( { type: 'PLACE_COMPONENT', sku, wall, position } );

export const moveComponent = (
	placementId: string,
	position: { x: Millimeters; y: Millimeters },
	wall?: WallId
): PlannerAction => ( { type: 'MOVE_COMPONENT', placementId, position, wall } );

export const removeComponent = ( placementId: string ): PlannerAction => ( {
	type: 'REMOVE_COMPONENT',
	placementId,
} );

export const loadConfiguration = (
	payload: ConfigurationPayload,
	placements: Placement[]
): PlannerAction => ( { type: 'LOAD_CONFIGURATION', payload, placements } );

export const setDealerNotes = ( notes: string ): PlannerAction => ( {
	type: 'SET_DEALER_NOTES',
	notes,
} );

export const resetConfiguration = (): PlannerAction => ( {
	type: 'RESET_CONFIGURATION',
} );
