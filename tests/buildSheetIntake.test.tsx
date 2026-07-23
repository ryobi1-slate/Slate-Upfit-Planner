import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';
import { App } from '../assets/src/app/App';
import { matchSupportedBuildSheetVehicle } from '../assets/src/domain/buildSheetIntake';

(
	globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
 ).IS_REACT_ACT_ENVIRONMENT = true;

function click( element: Element ) {
	element.dispatchEvent( new MouseEvent( 'click', { bubbles: true } ) );
}

describe( 'build-sheet intake vehicle matching', () => {
	it( 'matches supported 144 and 170 High Roof vehicles', () => {
		expect(
			matchSupportedBuildSheetVehicle( {
				wheelbase: '144',
				roofHeight: 'High',
			} )
		).toBe( 'sprinter-144-high-roof' );
		expect(
			matchSupportedBuildSheetVehicle( {
				wheelbase: '170',
				roofHeight: 'high',
			} )
		).toBe( 'sprinter-170-high-roof' );
	} );

	it( 'fails closed for unsupported geometry', () => {
		expect(
			matchSupportedBuildSheetVehicle( {
				wheelbase: '170 EXT',
				roofHeight: 'high',
			} )
		).toBeNull();
		expect(
			matchSupportedBuildSheetVehicle( {
				wheelbase: '144',
				roofHeight: 'standard',
			} )
		).toBeNull();
	} );
} );

describe( 'build-sheet review workflow', () => {
	let container: HTMLDivElement;
	let root: Root;
	const originalFetch = globalThis.fetch;

	beforeEach( () => {
		window.SlateUpfitPlanner = {
			restUrl: 'https://example.test/wp-json/slate-upfit-planner/v1',
			restNonce: 'nonce',
		};
		container = document.createElement( 'div' );
		document.body.appendChild( container );
		root = createRoot( container );
		act( () => root.render( <App /> ) );
	} );

	afterEach( () => {
		act( () => root.unmount() );
		container.remove();
		globalThis.fetch = originalFetch;
		delete window.SlateUpfitPlanner;
	} );

	it( 'requires explicit apply and warns before clearing placements', async () => {
		const response = {
			ok: true,
			filename: 'Mercedes-Build-Sheet.pdf',
			status: 'text_extracted' as const,
			fields: {
				wheelbase: {
					value: '170',
					status: 'recognized' as const,
					confidence: 0.98,
					source_snippet: 'IR6',
				},
				roof_height: {
					value: 'high',
					status: 'recognized' as const,
					confidence: 0.98,
					source_snippet: 'D03',
				},
			},
			recognized_option_codes: [ 'IR6', 'D03' ],
			unknown_option_codes: [ 'XYZ' ],
		};
		const fetchMock = jest.fn( async () => ( {
			ok: true,
			status: 200,
			json: async () => response,
		} ) );
		globalThis.fetch = fetchMock as unknown as typeof fetch;

		act( () => click( container.querySelector( '.sup-card__add' )! ) );
		expect( container.textContent ).toContain( '1 components placed.' );

		const input = container.querySelector(
			'input[type="file"]'
		) as HTMLInputElement;
		Object.defineProperty( input, 'files', {
			configurable: true,
			value: [
				new File( [ '%PDF-1.4' ], 'Mercedes Build Sheet.pdf', {
					type: 'application/pdf',
				} ),
			],
		} );
		act( () => input.dispatchEvent( new Event( 'change', { bubbles: true } ) ) );
		await act( async () => {
			click(
				Array.from( container.querySelectorAll( 'button' ) ).find(
					( button ) =>
						button.textContent?.includes( 'Read build sheet' )
				)!
			);
			await Promise.resolve();
			await Promise.resolve();
		} );

		expect( fetchMock ).toHaveBeenCalledTimes( 1 );
		const calls = fetchMock.mock.calls as unknown as Array<
			[ RequestInfo | URL, RequestInit ]
		>;
		const request = calls[ 0 ]?.[ 1 ];
		if ( ! request ) {
			throw new Error( 'Expected a build-sheet upload request.' );
		}
		expect( request.body ).toBeInstanceOf( FormData );
		expect( request.headers ).toEqual( { 'X-WP-Nonce': 'nonce' } );
		expect( container.textContent ).toContain( '98% confidence' );
		expect( container.textContent ).toContain( 'Unknown codes: XYZ' );
		expect( container.textContent ).toContain(
			'Applying this vehicle will clear all current placements.'
		);
		expect(
			( container.querySelector(
				'.sup-vehicle-selector'
			) as HTMLSelectElement ).value
		).toBe( 'sprinter-144-high-roof' );

		act( () =>
			click(
				Array.from( container.querySelectorAll( 'button' ) ).find(
					( button ) =>
						button.textContent?.includes( 'Apply vehicle to planner' )
				)!
			)
		);
		expect(
			( container.querySelector(
				'.sup-vehicle-selector'
			) as HTMLSelectElement ).value
		).toBe( 'sprinter-170-high-roof' );
		expect( container.textContent ).toContain( '0 components placed.' );
	} );
} );
