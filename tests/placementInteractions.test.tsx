import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';

import { App } from '../assets/src/app/App';

(
	globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
 ).IS_REACT_ACT_ENVIRONMENT = true;

function click( element: Element ) {
	act( () => {
		element.dispatchEvent(
			new MouseEvent( 'click', { bubbles: true, clientX: 112 } )
		);
	} );
}

function pointerMove( element: Element ) {
	act( () => {
		element.dispatchEvent(
			new MouseEvent( 'pointermove', { bubbles: true, clientX: 112 } )
		);
	} );
}

describe( 'product placement interactions', () => {
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

	it( 'places on the first Add click, updates the count, and remains armed', () => {
		const add = container.querySelector( '.sup-card__add' )!;
		click( add );

		expect( container.textContent ).toContain( '1 components placed.' );
		expect(
			container
				.querySelector( '.sup-card__select' )
				?.getAttribute( 'aria-pressed' )
		).toBe( 'true' );

		click( add );
		expect( container.textContent ).toContain( '2 components placed.' );
	} );

	it( 'commits the valid preview coordinates and blocks an invalid repeat', () => {
		click( container.querySelector( '.sup-card__select' )! );
		const capture = container.querySelector(
			'.sup-plan-wall-capture.is-active'
		)!;

		pointerMove( capture );
		expect(
			container
				.querySelector( '.sup-plan-preview' )
				?.getAttribute( 'pointer-events' )
		).toBe( 'none' );
		const preview = container.querySelector( '.sup-plan-preview rect' )!;
		const previewX = preview.getAttribute( 'x' );
		expect(
			container.querySelector( '.sup-plan-preview text' )?.textContent
		).toBe( '+ PLACE' );

		click( capture );
		expect( container.textContent ).toContain( '1 components placed.' );
		expect(
			container
				.querySelector( '.sup-plan-placement__body' )
				?.getAttribute( 'x' )
		).toBe( previewX );

		pointerMove( capture );
		expect(
			container.querySelector( '.sup-plan-preview text' )?.textContent
		).toBe( 'BLOCKED' );
		click( capture );
		expect( container.textContent ).toContain( '1 components placed.' );
	} );

	it( 'keeps the presentational zone overlay out of the pointer hit path', () => {
		expect(
			container
				.querySelector( '.sup-zones' )
				?.getAttribute( 'pointer-events' )
		).toBe( 'none' );
	} );

	it( 'preserves keyboard movement and deletion', () => {
		click( container.querySelector( '.sup-card__add' )! );
		const placement = container.querySelector( '.sup-plan-placement' )!;
		const initialX = Number(
			container
				.querySelector( '.sup-plan-placement__body' )
				?.getAttribute( 'x' )
		);

		act( () => {
			placement.dispatchEvent(
				new KeyboardEvent( 'keydown', {
					bubbles: true,
					key: 'ArrowRight',
				} )
			);
		} );
		expect(
			Number(
				container
					.querySelector( '.sup-plan-placement__body' )
					?.getAttribute( 'x' )
			)
		).toBe( initialX + 6 );

		act( () => {
			placement.dispatchEvent(
				new KeyboardEvent( 'keydown', { bubbles: true, key: 'Delete' } )
			);
		} );
		expect( container.textContent ).toContain( '0 components placed.' );
	} );
} );
