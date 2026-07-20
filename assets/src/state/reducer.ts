/**
 * Planner reducer. Pure, deterministic, serializable state transitions — no
 * side effects, no React, and NO geometry/validation logic (that lives in the
 * engine and is applied in the hook layer before dispatch).
 */

import type {
	Placement,
	PlannerComponent,
	VehicleGeometry,
	WallId,
} from '../types';
import { getVehicle } from '../data/geometry';
import type { PlannerAction, Position } from './actions';

/**
 * Highest numeric suffix among `placement-N` ids, floored at `floor`, so newly
 * placed components never collide with ids from a loaded configuration.
 * @param placements
 * @param floor
 */
function maxPlacementSeq( placements: Placement[], floor: number ): number {
	return placements.reduce( ( max, p ) => {
		const match = /placement-(\d+)/.exec( p.id );
		if ( ! match ) {
			return max;
		}
		const num = parseInt( match[ 1 ]!, 10 );
		return num > max ? num : max;
	}, floor );
}

/**
 * True for a wall id that has geometry in Phase 2.
 * @param wall
 */
function isValidWall( wall: unknown ): wall is WallId {
	return wall === 'driver' || wall === 'passenger';
}

export interface PlannerState {
	vehicle: VehicleGeometry;
	activeWall: WallId;
	/** Catalog product currently selected for placement. */
	selectedSku: string | null;
	/** Transient ghost preview position (not persisted). */
	preview: { wall: WallId; position: Position } | null;
	placements: Placement[];
	/** Currently selected placed component. */
	selectedPlacementId: string | null;
	componentsBySku: Record< string, PlannerComponent >;
	configurationId: string | null;
	dealerNotes: string;
	/** Monotonic counter for minting placement ids without Date/random. */
	placementSeq: number;
}

export interface PlannerInit {
	vehicle: VehicleGeometry;
	componentsBySku: Record< string, PlannerComponent >;
	placements: Placement[];
	activeWall?: WallId;
}

export function initPlannerState( init: PlannerInit ): PlannerState {
	return {
		vehicle: init.vehicle,
		activeWall: init.activeWall ?? 'driver',
		selectedSku: null,
		preview: null,
		placements: init.placements,
		selectedPlacementId: null,
		componentsBySku: init.componentsBySku,
		configurationId: null,
		dealerNotes: '',
		placementSeq: maxPlacementSeq(
			init.placements,
			init.placements.length
		),
	};
}

export function plannerReducer(
	state: PlannerState,
	action: PlannerAction
): PlannerState {
	switch ( action.type ) {
		case 'SELECT_VEHICLE':
			return {
				...state,
				vehicle: action.vehicle,
				activeWall: 'driver',
				// Vehicle change invalidates existing placements.
				placements: [],
				preview: null,
				selectedPlacementId: null,
			};

		case 'SELECT_PRODUCT':
			return { ...state, selectedSku: action.sku };

		case 'PREVIEW_PLACEMENT':
			return { ...state, preview: action.preview };

		case 'PLACE_COMPONENT': {
			const seq = state.placementSeq + 1;
			const placement: Placement = {
				id: `placement-${ seq }`,
				sku: action.sku,
				wall: action.wall,
				position: action.position,
			};
			return {
				...state,
				placements: [ ...state.placements, placement ],
				placementSeq: seq,
				selectedPlacementId: placement.id,
				preview: null,
			};
		}

		case 'SELECT_PLACEMENT':
			return { ...state, selectedPlacementId: action.placementId };

		case 'MOVE_PLACEMENT':
			return {
				...state,
				placements: state.placements.map( ( p ) =>
					p.id === action.placementId
						? { ...p, position: action.position }
						: p
				),
			};

		case 'REMOVE_PLACEMENT':
			return {
				...state,
				placements: state.placements.filter(
					( p ) => p.id !== action.placementId
				),
				selectedPlacementId:
					state.selectedPlacementId === action.placementId
						? null
						: state.selectedPlacementId,
			};

		case 'SWITCH_WALL':
			return {
				...state,
				activeWall: action.wall,
				preview: null,
				selectedPlacementId: null,
			};

		case 'LOAD_CONFIGURATION': {
			// Unknown vehicle ids retain the current vehicle rather than guessing
			// a body geometry. Supported ids (including explicit legacy aliases)
			// restore their canonical runtime vehicle with the saved placements.
			const loadedVehicle =
				getVehicle( action.payload.vehicle.id ) ?? state.vehicle;
			// Sanitize the restored wall against the loaded vehicle. A legacy or
			// unknown wall would resolve to no geometry and blank the canvas, so
			// retain the current active wall.
			const loadedWall = action.payload.vehicle.wall;
			return {
				...state,
				vehicle: loadedVehicle,
				configurationId: action.payload.configuration_id,
				activeWall:
					isValidWall( loadedWall ) &&
					loadedVehicle.walls.some(
						( wall ) => wall.wall === loadedWall
					)
						? loadedWall
						: state.activeWall,
				placements: action.placements,
				dealerNotes: action.payload.dealer_notes,
				preview: null,
				selectedPlacementId: null,
				placementSeq: maxPlacementSeq(
					action.placements,
					state.placementSeq
				),
			};
		}

		case 'SET_DEALER_NOTES':
			return { ...state, dealerNotes: action.notes };

		case 'CLEAR_WALL':
			return {
				...state,
				placements: state.placements.filter(
					( p ) => p.wall !== action.wall
				),
				preview: null,
				selectedPlacementId: null,
			};

		case 'RESET_CONFIGURATION':
			return {
				...state,
				selectedSku: null,
				preview: null,
				placements: [],
				selectedPlacementId: null,
				configurationId: null,
				dealerNotes: '',
			};

		default:
			return state;
	}
}
