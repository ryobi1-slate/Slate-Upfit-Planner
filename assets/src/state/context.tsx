/**
 * React Context wiring for the planner store. Components read state and dispatch
 * through this context; the reducer itself stays pure and framework-agnostic.
 */

import {
	createContext,
	useContext,
	useMemo,
	useReducer,
} from '@wordpress/element';
import type { ReactNode } from 'react';
import {
	initPlannerState,
	plannerReducer,
	type PlannerInit,
	type PlannerState,
} from './reducer';
import type { PlannerAction } from './actions';
import { calculateTotals } from '../engine';
import type { Totals } from '../types';

interface PlannerContextValue {
	state: PlannerState;
	dispatch: ( action: PlannerAction ) => void;
	totals: Totals;
}

const PlannerContext = createContext< PlannerContextValue | null >( null );

export function PlannerProvider( {
	init,
	children,
}: {
	init: PlannerInit;
	children: ReactNode;
} ) {
	const [ state, dispatch ] = useReducer(
		plannerReducer,
		init,
		initPlannerState
	);

	const totals = useMemo(
		() =>
			calculateTotals(
				state.vehicle,
				state.placements,
				state.componentsBySku
			),
		[ state.vehicle, state.placements, state.componentsBySku ]
	);

	const value = useMemo< PlannerContextValue >(
		() => ( { state, dispatch, totals } ),
		[ state, totals ]
	);

	return (
		<PlannerContext.Provider value={ value }>
			{ children }
		</PlannerContext.Provider>
	);
}

export function usePlannerContext(): PlannerContextValue {
	const ctx = useContext( PlannerContext );
	if ( ! ctx ) {
		throw new Error(
			'usePlannerContext must be used within a PlannerProvider.'
		);
	}
	return ctx;
}
