/**
 * Planner reducer. Pure state transitions — no side effects, no React. The
 * engine is consulted for placement geometry, but persistence/quote effects
 * live in services and hooks, not here.
 */

import { findOpenPlacement } from '../engine';
import type {
	Placement,
	PlannerComponent,
	VehicleGeometry,
	WallId,
} from '../types';
import type { PlannerAction } from './actions';

export interface PlannerState {
	vehicle: VehicleGeometry;
	activeWall: WallId | null;
	selectedSku: string | null;
	placements: Placement[];
	componentsBySku: Record< string, PlannerComponent >;
	configurationId: string | null;
	dealerNotes: string;
	/** Monotonic counter used to mint unique placement ids without Date/random. */
	placementSeq: number;
}

export interface PlannerInit {
	vehicle: VehicleGeometry;
	componentsBySku: Record< string, PlannerComponent >;
	placements: Placement[];
	activeWall?: WallId | null;
}

export function initPlannerState( init: PlannerInit ): PlannerState {
	return {
		vehicle: init.vehicle,
		activeWall: init.activeWall ?? init.vehicle.walls[ 0 ]?.id ?? null,
		selectedSku: null,
		placements: init.placements,
		componentsBySku: init.componentsBySku,
		configurationId: null,
		dealerNotes: '',
		placementSeq: init.placements.length,
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
				activeWall: action.vehicle.walls[ 0 ]?.id ?? null,
				// Vehicle change invalidates existing placements.
				placements: [],
			};

		case 'SELECT_WALL':
			return { ...state, activeWall: action.wall };

		case 'SELECT_PRODUCT':
			return { ...state, selectedSku: action.sku };

		case 'PLACE_COMPONENT': {
			const component = state.componentsBySku[ action.sku ];
			const wall = state.vehicle.walls.find(
				( w ) => w.id === action.wall
			);
			if ( ! component || ! wall ) {
				return state;
			}

			const position =
				action.position ??
				findOpenPlacement(
					component,
					wall,
					state.placements,
					state.componentsBySku
				);

			if ( ! position ) {
				// No open space; leave state unchanged.
				return state;
			}

			const seq = state.placementSeq + 1;
			const placement: Placement = {
				id: `placement-${ seq }`,
				sku: action.sku,
				wall: action.wall,
				position,
			};

			return {
				...state,
				placements: [ ...state.placements, placement ],
				placementSeq: seq,
			};
		}

		case 'MOVE_COMPONENT':
			return {
				...state,
				placements: state.placements.map( ( p ) =>
					p.id === action.placementId
						? {
								...p,
								position: action.position,
								wall: action.wall ?? p.wall,
						  }
						: p
				),
			};

		case 'REMOVE_COMPONENT':
			return {
				...state,
				placements: state.placements.filter(
					( p ) => p.id !== action.placementId
				),
			};

		case 'LOAD_CONFIGURATION':
			return {
				...state,
				configurationId: action.payload.configuration_id,
				activeWall: action.payload.vehicle.wall ?? state.activeWall,
				placements: action.placements,
				dealerNotes: action.payload.dealer_notes,
				placementSeq: Math.max(
					state.placementSeq,
					action.placements.length
				),
			};

		case 'SET_DEALER_NOTES':
			return { ...state, dealerNotes: action.notes };

		case 'RESET_CONFIGURATION':
			return {
				...state,
				selectedSku: null,
				placements: [],
				configurationId: null,
				dealerNotes: '',
			};

		default:
			return state;
	}
}
