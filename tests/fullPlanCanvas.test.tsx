import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { App } from '../assets/src/app/App';
import { FullPlanCanvas } from '../assets/src/components/canvas/FullPlanCanvas';
import { COMPONENTS_BY_SKU } from '../assets/src/data/catalog';
import { SPRINTER_144_HR } from '../assets/src/data/geometry';
import { PlannerProvider } from '../assets/src/state/context';
import type { Placement, VehicleGeometry } from '../assets/src/types';

(
	globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
 ).IS_REACT_ACT_ENVIRONMENT = true;
const click = ( element: Element, clientX = 180 ) =>
	act( () =>
		element.dispatchEvent(
			new MouseEvent( 'click', { bubbles: true, clientX } )
		)
	);
const pointerMove = ( element: Element, clientX = 180 ) =>
	act( () =>
		element.dispatchEvent(
			new MouseEvent( 'pointermove', { bubbles: true, clientX } )
		)
	);

describe( 'combined technical plan', () => {
	let container: HTMLDivElement;
	let root: Root;
	beforeEach( () => {
		container = document.createElement( 'div' );
		document.body.appendChild( container );
		root = createRoot( container );
		Object.defineProperty( SVGSVGElement.prototype, 'createSVGPoint', {
			configurable: true,
			value: () => ( {
				x: 0,
				y: 0,
				matrixTransform() {
					return this;
				},
			} ),
		} );
		Object.defineProperty( SVGSVGElement.prototype, 'getScreenCTM', {
			configurable: true,
			value: () => ( { inverse: () => ( {} ) } ),
		} );
		act( () => root.render( <App /> ) );
	} );
	afterEach( () => {
		act( () => root.unmount() );
		container.remove();
	} );
	it( 'renders both walls and engineering zones in one horizontal plan', () => {
		const plan = container.querySelector( '.sup-full-plan' );
		expect( plan?.getAttribute( 'aria-label' ) ).toBe(
			'Full vehicle technical plan'
		);
		for ( const label of [
			'PASSENGER SIDE',
			'DRIVER SIDE',
			'SLIDING DOOR',
			'WHEEL WELL',
			'CARGO LENGTH',
		] )
			expect( plan?.textContent ).toContain( label );
	} );
	it( 'renders the verified passenger contoured no-mount zone', () => {
		const zone = container.querySelector(
			'[data-zone-kind="no-mount"][data-from="8"][data-to="20"]'
		);

		expect( zone ).not.toBeNull();
		expect( zone?.getAttribute( 'class' ) ).toContain(
			'sup-plan-no-mount'
		);
	} );
	it( 'keeps passive hover local and preserves the Add target and selection', () => {
		const add = container.querySelector( '.sup-card__add' )!;
		click( add );
		const selected = container.querySelector( '.sup-plan-placement' )!;
		expect( selected.getAttribute( 'aria-pressed' ) ).toBe( 'true' );

		const passengerLane = container.querySelector(
			'.sup-plan-wall-capture[data-wall="passenger"]'
		)!;
		pointerMove( passengerLane, 800 );

		expect( selected.getAttribute( 'aria-pressed' ) ).toBe( 'true' );
		expect(
			container.querySelector( '.sup-wall-tab[aria-selected="true"]' )
				?.textContent
		).toContain( 'Driver' );

		click( add );
		const labels = Array.from(
			container.querySelectorAll( '.sup-plan-placement' )
		).map( ( node ) => node.getAttribute( 'aria-label' ) ?? '' );
		expect( labels ).toHaveLength( 2 );
		expect(
			labels.every( ( label ) => label.includes( 'driver wall' ) )
		).toBe( true );
	} );
	it( 'commits a canvas placement to the intentionally clicked wall', () => {
		click( container.querySelector( '.sup-card__select' )! );
		click(
			container.querySelector(
				'.sup-plan-wall-capture[data-wall="passenger"]'
			)!,
			800
		);

		expect(
			container
				.querySelector( '.sup-plan-placement' )
				?.getAttribute( 'aria-label' )
		).toContain( 'passenger wall' );
		expect(
			container.querySelector( '.sup-wall-tab[aria-selected="true"]' )
				?.textContent
		).toContain( 'Passenger' );
	} );
	it( 'adds products to driver and passenger walls from the shared tray', () => {
		const vehicle = container.querySelector(
			'.sup-vehicle-selector'
		) as HTMLSelectElement;
		act( () => {
			vehicle.value = 'sprinter-170-high-roof';
			vehicle.dispatchEvent( new Event( 'change', { bubbles: true } ) );
		} );
		const add = container.querySelector( '.sup-card__add' )!;
		click( add );
		click(
			Array.from( container.querySelectorAll( '.sup-wall-tab' ) ).find(
				( button ) => button.textContent?.includes( 'Passenger' )
			)!
		);
		click( add );
		const labels = Array.from(
			container.querySelectorAll( '.sup-plan-placement' )
		).map( ( node ) => node.getAttribute( 'aria-label' ) ?? '' );
		expect(
			labels.some( ( label ) => label.includes( 'driver wall' ) )
		).toBe( true );
		expect(
			labels.some( ( label ) => label.includes( 'passenger wall' ) )
		).toBe( true );
	} );
	it( 'renders each wall wheel well from its own geometry', () => {
		const vehicle: VehicleGeometry = {
			...SPRINTER_144_HR,
			walls: SPRINTER_144_HR.walls.map( ( wall ) => ( {
				...wall,
				wheelWells: [
					{
						...wall.wheelWells[ 0 ],
						from: wall.wall === 'driver' ? 82 : 70,
						to: wall.wall === 'driver' ? 118 : 106,
					},
				],
			} ) ),
		};
		act( () =>
			root.render(
				<PlannerProvider
					init={ {
						vehicle,
						componentsBySku: COMPONENTS_BY_SKU,
						placements: [],
						activeWall: 'driver',
					} }
				>
					<FullPlanCanvas />
				</PlannerProvider>
			)
		);

		const passengerWheel = container.querySelector(
			'[data-wheel-wall="passenger"]'
		);
		const driverWheel = container.querySelector(
			'[data-wheel-wall="driver"]'
		);
		expect( passengerWheel?.getAttribute( 'data-from' ) ).toBe( '70' );
		expect( passengerWheel?.getAttribute( 'data-to' ) ).toBe( '106' );
		expect( driverWheel?.getAttribute( 'data-from' ) ).toBe( '82' );
		expect( driverWheel?.getAttribute( 'data-to' ) ).toBe( '118' );
	} );
	it( 'keeps selection distinct while rendering ranged conflicts and warnings', () => {
		const placements: Placement[] = [
			{
				id: 'door-conflict',
				sku: '22-3436',
				wall: 'passenger',
				position: { x: 50, y: 0 },
			},
			{
				id: 'wheel-warning',
				sku: '22-3436',
				wall: 'driver',
				position: { x: 60, y: 0 },
			},
		];
		act( () =>
			root.render(
				<PlannerProvider
					init={ {
						vehicle: SPRINTER_144_HR,
						componentsBySku: COMPONENTS_BY_SKU,
						placements,
						activeWall: 'passenger',
					} }
				>
					<FullPlanCanvas />
				</PlannerProvider>
			)
		);

		const conflict = container.querySelector(
			'[data-placement-id="door-conflict"]'
		)!;
		act( () =>
			conflict.dispatchEvent(
				new MouseEvent( 'pointerdown', { bubbles: true, clientX: 380 } )
			)
		);

		expect(
			conflict.classList.contains( 'sup-plan-placement--error' )
		).toBe( true );
		expect(
			conflict.classList.contains( 'sup-plan-placement--selected' )
		).toBe( true );
		expect(
			conflict.querySelector(
				'.sup-plan-placement__conflict[data-issue-code="DOOR_CONFLICT"]'
			)
		).not.toBeNull();

		const warning = container.querySelector(
			'[data-placement-id="wheel-warning"]'
		)!;
		expect(
			warning.classList.contains( 'sup-plan-placement--warning' )
		).toBe( true );
		expect(
			warning.querySelector( '.sup-plan-placement__warning-overlap' )
		).not.toBeNull();
		expect(
			warning.querySelector( '.sup-plan-placement__conflict' )
		).toBeNull();
	} );
} );
