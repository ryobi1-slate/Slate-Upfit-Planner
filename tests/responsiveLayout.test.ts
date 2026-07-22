import { describe, expect, it } from '@jest/globals';
import { readFileSync } from 'fs';
import path from 'path';

const css = readFileSync(
	path.join( process.cwd(), 'assets/src/styles/index.css' ),
	'utf8'
);

function declarationsFor( selector: string ): string {
	const escaped = selector.replace( /[.*+?^${}()|[\]\\]/gu, '\\$&' );
	const match = css.match(
		new RegExp( `${ escaped }\\s*\\{([^}]*)\\}`, 'u' )
	);

	expect( match ).not.toBeNull();
	return match?.[ 1 ] ?? '';
}

describe( 'responsive planner layout CSS', () => {
	it( 'uses a dominant workspace and two-to-one lower section', () => {
		expect( declarationsFor( '.sup-body' ) ).toContain(
			'minmax(0, 2fr) minmax(280px, 1fr)'
		);
		expect( declarationsFor( '.sup-body' ) ).toContain( '"canvas canvas"' );
		expect( declarationsFor( '.sup-body > *' ) ).toContain(
			'min-width: 0'
		);
	} );

	it( 'selects responsive modes from planner width instead of viewport width', () => {
		expect( declarationsFor( '.slate-upfit-planner-root' ) ).toContain(
			'container-name: slate-upfit-planner'
		);
		expect( declarationsFor( '.slate-upfit-planner-root' ) ).toContain(
			'container-type: inline-size'
		);
		expect( css ).not.toContain( '@media (max-width: 900px)' );
		expect( css ).not.toContain( '@media (max-width: 640px)' );
	} );

	it( 'stacks into a shrinkable single column in constrained containers', () => {
		const tabletRules = css.slice(
			css.indexOf( '@container slate-upfit-planner (max-width: 900px)' )
		);

		expect( tabletRules ).toContain(
			'grid-template-columns: minmax(0, 1fr)'
		);
		expect( tabletRules ).not.toContain( 'grid-template-columns: 676px' );
	} );

	it( 'wraps page controls and catalog cards in phone-width containers', () => {
		const phoneRules = css.slice(
			css.indexOf( '@container slate-upfit-planner (max-width: 640px)' )
		);

		expect( phoneRules ).toContain( '.sup-controls,' );
		expect( phoneRules ).toContain(
			'grid-template-columns: minmax(0, 1fr)'
		);
		expect( phoneRules ).toContain( 'flex-direction: column' );
		expect( phoneRules ).toContain( 'grid-row: auto' );
		expect( phoneRules ).toContain( 'flex-wrap: wrap' );
		expect( phoneRules ).toContain( 'width: 100%' );
		expect( phoneRules ).toContain( 'min-width: 0' );
		expect( phoneRules ).not.toContain( 'overflow-x: hidden' );
	} );

	it( 'uses the Dealer Portal page-header hierarchy without a duplicate app nav', () => {
		expect( declarationsFor( '.sup-page-header' ) ).toContain(
			'border-bottom: 1px solid var(--slate-hair)'
		);
		expect( css ).not.toContain( '.sup-nav {' );
	} );

	it( 'keeps wide canvas content contained inside its own scroll region', () => {
		expect( declarationsFor( '.sup-canvas__stage' ) ).toContain(
			'max-width: 100%'
		);
		expect( declarationsFor( '.sup-canvas__stage' ) ).toContain(
			'overflow-x: auto'
		);
		expect( declarationsFor( '.sup-wall-canvas' ) ).toContain(
			'min-width: 640px'
		);
		expect( declarationsFor( '.sup-full-plan' ) ).toContain(
			'min-width: 920px'
		);
	} );

	it( 'lets product-card text shrink and wrap without changing card actions', () => {
		expect( declarationsFor( '.sup-card__select' ) ).toContain(
			'min-width: 0'
		);
		expect( declarationsFor( '.sup-card__meta' ) ).toContain(
			'overflow-wrap: anywhere'
		);
	} );
} );
