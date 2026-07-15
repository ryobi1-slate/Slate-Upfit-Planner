/**
 * Convenience hook exposing planner state, memoized selectors, and bound action
 * dispatchers to components.
 */

import { useCallback, useMemo } from '@wordpress/element';
import { usePlannerContext } from '../state/context';
import * as actions from '../state/actions';
import { buildNormalizedPayload } from '../engine';
import type { ConfigurationPayload, Millimeters, WallId } from '../types';

export function usePlanner() {
	const { state, dispatch, totals } = usePlannerContext();

	const selectVehicle = useCallback(
		( ...args: Parameters< typeof actions.selectVehicle > ) =>
			dispatch( actions.selectVehicle( ...args ) ),
		[ dispatch ]
	);

	const selectWall = useCallback(
		( wall: WallId ) => dispatch( actions.selectWall( wall ) ),
		[ dispatch ]
	);

	const selectProduct = useCallback(
		( sku: string | null ) => dispatch( actions.selectProduct( sku ) ),
		[ dispatch ]
	);

	const placeComponent = useCallback(
		(
			sku: string,
			wall: WallId,
			position?: { x: Millimeters; y: Millimeters }
		) => dispatch( actions.placeComponent( sku, wall, position ) ),
		[ dispatch ]
	);

	const moveComponent = useCallback(
		(
			placementId: string,
			position: { x: Millimeters; y: Millimeters },
			wall?: WallId
		) => dispatch( actions.moveComponent( placementId, position, wall ) ),
		[ dispatch ]
	);

	const removeComponent = useCallback(
		( placementId: string ) =>
			dispatch( actions.removeComponent( placementId ) ),
		[ dispatch ]
	);

	const setDealerNotes = useCallback(
		( notes: string ) => dispatch( actions.setDealerNotes( notes ) ),
		[ dispatch ]
	);

	const resetConfiguration = useCallback(
		() => dispatch( actions.resetConfiguration() ),
		[ dispatch ]
	);

	const buildPayload = useCallback(
		(): ConfigurationPayload =>
			buildNormalizedPayload( {
				configurationId: state.configurationId,
				vehicle: state.vehicle,
				activeWall: state.activeWall,
				placements: state.placements,
				componentsBySku: state.componentsBySku,
				dealerNotes: state.dealerNotes,
			} ),
		[ state ]
	);

	const catalog = useMemo(
		() => Object.values( state.componentsBySku ),
		[ state.componentsBySku ]
	);

	return {
		state,
		totals,
		catalog,
		selectVehicle,
		selectWall,
		selectProduct,
		placeComponent,
		moveComponent,
		removeComponent,
		setDealerNotes,
		resetConfiguration,
		buildPayload,
	};
}
