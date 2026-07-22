import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { App } from '../assets/src/app/App';

(
	globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
 ).IS_REACT_ACT_ENVIRONMENT = true;
const click = ( element: Element ) =>
	act( () =>
		element.dispatchEvent(
			new MouseEvent( 'click', { bubbles: true, clientX: 180 } )
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
} );
