/**
 * Convenience hook exposing planner state, memoized selectors, and bound
 * actions to components.
 *
 * This layer owns the geometry/validation calls (clamp, snap, auto-placement,
 * fitment) and dispatches already-resolved values, keeping the reducer pure.
 */

import { useCallback, useMemo } from '@wordpress/element';
import { usePlannerContext } from '../state/context';
import * as actions from '../state/actions';
import {
	buildNormalizedPayload,
	checkPlacement,
	clampPlacement,
	findOpenPlacement,
	getRemainingWallLength,
	validateConfiguration,
} from '../engine';
import { getVehicle, getWall, VEHICLES } from '../data/geometry';
import type {
	ConfigurationPayload,
	FitmentResult,
	Inches,
	Placement,
	VehicleGeometry,
	WallGeometry,
	WallId,
} from '../types';

export function resolveSupportedVehicle(
	vehicleId: string
): VehicleGeometry | undefined {
	return getVehicle( vehicleId );
}

export function usePlanner() {
	const { state, dispatch, totals } = usePlannerContext();
	const { vehicle, activeWall, selectedSku, placements, componentsBySku } =
		state;

	const activeWallGeometry = useMemo< WallGeometry | undefined >(
		() => getWall( vehicle, activeWall ),
		[ vehicle, activeWall ]
	);

	const catalog = useMemo(
		() => Object.values( componentsBySku ),
		[ componentsBySku ]
	);

	const selectProduct = useCallback(
		( sku: string | null ) => dispatch( actions.selectProduct( sku ) ),
		[ dispatch ]
	);

	const selectVehicle = useCallback(
		( vehicleId: string ) => {
			const nextVehicle = resolveSupportedVehicle( vehicleId );
			if ( nextVehicle ) {
				dispatch( actions.selectVehicle( nextVehicle ) );
			}
		},
		[ dispatch ]
	);

	const switchWall = useCallback(
		( wall: WallId ) => dispatch( actions.switchWall( wall ) ),
		[ dispatch ]
	);

	const selectPlacement = useCallback(
		( id: string | null ) => dispatch( actions.selectPlacement( id ) ),
		[ dispatch ]
	);

	const removePlacement = useCallback(
		( id: string ) => dispatch( actions.removePlacement( id ) ),
		[ dispatch ]
	);

	const clearWall = useCallback(
		( wall: WallId ) => dispatch( actions.clearWall( wall ) ),
		[ dispatch ]
	);

	const resetConfiguration = useCallback(
		() => dispatch( actions.resetConfiguration() ),
		[ dispatch ]
	);

	const setDealerNotes = useCallback(
		( notes: string ) => dispatch( actions.setDealerNotes( notes ) ),
		[ dispatch ]
	);

	/** Update the ghost preview for the selected product at a raw inch position. */
	const previewAt = useCallback(
		( wall: WallId, rawInches: Inches ) => {
			const sku = selectedSku;
			const wallGeo = getWall( vehicle, wall );
			const component = sku ? componentsBySku[ sku ] : undefined;
			if ( ! sku || ! wallGeo || ! component ) {
				dispatch( actions.previewPlacement( null ) );
				return;
			}
			const x = clampPlacement( rawInches, component, wallGeo );
			dispatch(
				actions.previewPlacement( { wall, position: { x, y: 0 } } )
			);
		},
		[ dispatch, selectedSku, vehicle, componentsBySku ]
	);

	const clearPreview = useCallback(
		() => dispatch( actions.previewPlacement( null ) ),
		[ dispatch ]
	);

	/**
	 * Place the selected product. With a raw inch position, clamps/snaps to it;
	 * otherwise auto-finds the first legal open spot. No-op if nothing fits.
	 */
	const placeSelected = useCallback(
		( wall: WallId, rawInches?: Inches ) => {
			const sku = selectedSku;
			const wallGeo = getWall( vehicle, wall );
			const component = sku ? componentsBySku[ sku ] : undefined;
			if ( ! sku || ! wallGeo || ! component ) {
				return;
			}
			let position: { x: Inches; y: Inches } | null;
			if ( rawInches !== undefined ) {
				position = {
					x: clampPlacement( rawInches, component, wallGeo ),
					y: 0,
				};
			} else {
				position = findOpenPlacement(
					component,
					wallGeo,
					placements,
					componentsBySku
				);
			}
			if ( ! position ) {
				return;
			}
			dispatch( actions.placeComponent( sku, wall, position ) );
		},
		[ dispatch, selectedSku, vehicle, placements, componentsBySku ]
	);

	/** Move a placed component to a raw inch position (clamped/snapped). */
	const moveTo = useCallback(
		( placementId: string, rawInches: Inches ) => {
			const placement = placements.find( ( p ) => p.id === placementId );
			const wallGeo = placement
				? getWall( vehicle, placement.wall )
				: undefined;
			const component = placement
				? componentsBySku[ placement.sku ]
				: undefined;
			if ( ! placement || ! wallGeo || ! component ) {
				return;
			}
			const x = clampPlacement( rawInches, component, wallGeo );
			dispatch( actions.movePlacement( placementId, { x, y: 0 } ) );
		},
		[ dispatch, placements, vehicle, componentsBySku ]
	);

	/** Fitment result for a single placement (for canvas conflict rendering). */
	const fitmentFor = useCallback(
		( placement: Placement ): FitmentResult | null => {
			const wallGeo = getWall( vehicle, placement.wall );
			const component = componentsBySku[ placement.sku ];
			if ( ! wallGeo || ! component ) {
				return null;
			}
			return checkPlacement(
				placement,
				component,
				vehicle,
				wallGeo,
				placements,
				componentsBySku
			);
		},
		[ vehicle, placements, componentsBySku ]
	);

	const issues = useMemo(
		() => validateConfiguration( vehicle, placements, componentsBySku ),
		[ vehicle, placements, componentsBySku ]
	);

	const remainingOnActiveWall = useMemo(
		() =>
			activeWallGeometry
				? getRemainingWallLength(
						activeWallGeometry,
						placements,
						componentsBySku
				  )
				: 0,
		[ activeWallGeometry, placements, componentsBySku ]
	);

	const buildPayload = useCallback(
		(): ConfigurationPayload =>
			buildNormalizedPayload( {
				configurationId: state.configurationId,
				vehicle,
				activeWall,
				placements,
				componentsBySku,
				dealerNotes: state.dealerNotes,
			} ),
		[
			state.configurationId,
			vehicle,
			activeWall,
			placements,
			componentsBySku,
			state.dealerNotes,
		]
	);

	return {
		state,
		totals,
		catalog,
		supportedVehicles: VEHICLES,
		activeWallGeometry,
		issues,
		remainingOnActiveWall,
		selectVehicle,
		selectProduct,
		switchWall,
		selectPlacement,
		previewAt,
		clearPreview,
		placeSelected,
		moveTo,
		removePlacement,
		clearWall,
		resetConfiguration,
		setDealerNotes,
		fitmentFor,
		buildPayload,
	};
}
