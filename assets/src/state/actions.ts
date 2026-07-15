/**
 * Action types and creators for the planner reducer. Kept separate from the
 * reducer so components import lightweight creators without pulling internals.
 *
 * Placement geometry (auto-position, snap, clamp, validation) is computed by
 * the engine in the hook layer BEFORE dispatch — actions carry explicit,
 * already-resolved values so the reducer stays deterministic and serializable.
 */

import type {
	ConfigurationPayload,
	Inches,
	Placement,
	VehicleGeometry,
	WallId,
} from '../types';

export type Position = { x: Inches; y: Inches };

export type PlannerAction =
	| { type: 'SELECT_VEHICLE'; vehicle: VehicleGeometry }
	| { type: 'SELECT_PRODUCT'; sku: string | null }
	| {
			type: 'PREVIEW_PLACEMENT';
			preview: { wall: WallId; position: Position } | null;
	  }
	| { type: 'PLACE_COMPONENT'; sku: string; wall: WallId; position: Position }
	| { type: 'SELECT_PLACEMENT'; placementId: string | null }
	| { type: 'MOVE_PLACEMENT'; placementId: string; position: Position }
	| { type: 'REMOVE_PLACEMENT'; placementId: string }
	| { type: 'SWITCH_WALL'; wall: WallId }
	| {
			type: 'LOAD_CONFIGURATION';
			payload: ConfigurationPayload;
			placements: Placement[];
	  }
	| { type: 'SET_DEALER_NOTES'; notes: string }
	| { type: 'CLEAR_WALL'; wall: WallId }
	| { type: 'RESET_CONFIGURATION' };

export const selectVehicle = ( vehicle: VehicleGeometry ): PlannerAction => ( {
	type: 'SELECT_VEHICLE',
	vehicle,
} );

export const selectProduct = ( sku: string | null ): PlannerAction => ( {
	type: 'SELECT_PRODUCT',
	sku,
} );

export const previewPlacement = (
	preview: { wall: WallId; position: Position } | null
): PlannerAction => ( { type: 'PREVIEW_PLACEMENT', preview } );

export const placeComponent = (
	sku: string,
	wall: WallId,
	position: Position
): PlannerAction => ( { type: 'PLACE_COMPONENT', sku, wall, position } );

export const selectPlacement = (
	placementId: string | null
): PlannerAction => ( {
	type: 'SELECT_PLACEMENT',
	placementId,
} );

export const movePlacement = (
	placementId: string,
	position: Position
): PlannerAction => ( { type: 'MOVE_PLACEMENT', placementId, position } );

export const removePlacement = ( placementId: string ): PlannerAction => ( {
	type: 'REMOVE_PLACEMENT',
	placementId,
} );

export const switchWall = ( wall: WallId ): PlannerAction => ( {
	type: 'SWITCH_WALL',
	wall,
} );

export const loadConfiguration = (
	payload: ConfigurationPayload,
	placements: Placement[]
): PlannerAction => ( { type: 'LOAD_CONFIGURATION', payload, placements } );

export const setDealerNotes = ( notes: string ): PlannerAction => ( {
	type: 'SET_DEALER_NOTES',
	notes,
} );

export const clearWall = ( wall: WallId ): PlannerAction => ( {
	type: 'CLEAR_WALL',
	wall,
} );

export const resetConfiguration = (): PlannerAction => ( {
	type: 'RESET_CONFIGURATION',
} );
