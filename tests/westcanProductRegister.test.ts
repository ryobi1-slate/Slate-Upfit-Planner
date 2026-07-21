import fs from 'fs';
import path from 'path';
import { describe, expect, it } from '@jest/globals';
import { classifyWestcanProduct } from '../assets/src/data/westcanProductClassification';
import type { WestcanCategoryCandidate } from '../assets/src/data/westcanProductClassification';
import { INITIAL_PLACEMENTS, SHELVES } from '../assets/src/data/catalog';
import { formatComponentWeight } from '../assets/src/components/ConfigurationRail';

const root = path.resolve( __dirname, '..' );
const registerPath = path.join( root, 'docs/data-intake/westcan-products/westcan-product-register.csv' );

function parseCsv( text: string ): string[][] {
	const rows: string[][] = [];
	let row: string[] = [], field = '', quoted = false;
	for ( let i = 0; i < text.length; i++ ) {
		const char = text[ i ];
		if ( quoted && char === '"' && text[ i + 1 ] === '"' ) { field += '"'; i++; }
		else if ( char === '"' ) quoted = ! quoted;
		else if ( char === ',' && ! quoted ) { row.push( field ); field = ''; }
		else if ( char === '\n' && ! quoted ) { row.push( field.replace( /\r$/, '' ) ); rows.push( row ); row = []; field = ''; }
		else field += char;
	}
	return rows.filter( ( value ) => value.some( Boolean ) );
}

describe( 'Westcan source register', () => {
	const [ headers, ...values ] = parseCsv( fs.readFileSync( registerPath, 'utf8' ) );
	const rows = values.map( ( row ) => Object.fromEntries( headers.map( ( header, i ) => [ header, row[ i ] ] ) ) );

	it( 'preserves all 1,527 source rows with stable unique IDs', () => {
		expect( rows ).toHaveLength( 1527 );
		expect( new Set( rows.map( ( row ) => row.source_row_id ) ).size ).toBe( 1527 );
	} );

	it( 'contains no pricing fields or workstation-local archive paths', () => {
		expect( headers.some( ( header ) => /price|cost/i.test( header ) ) ).toBe( false );
		expect( rows.every( ( row ) => row.source_archive_locator.startsWith( 'slate-engineering-source-archive/' ) ) ).toBe( true );
		expect( rows.some( ( row ) => /^[A-Z]:\\/i.test( row.source_archive_locator ) ) ).toBe( false );
	} );

	it( 'classifies blank and zero weights as unavailable', () => {
		expect( rows.filter( ( row ) => row.weight_status === 'unavailable_blank' ) ).toHaveLength( 59 );
		expect( rows.filter( ( row ) => row.weight_status === 'unavailable_zero' ) ).toHaveLength( 80 );
		expect( rows.filter( ( row ) => row.weight_status !== 'published' ).every( ( row ) => row.source_weight_lb === '' ) ).toBe( true );
	} );

	it( 'preserves package dimensions separately', () => {
		expect( headers ).toEqual( expect.arrayContaining( [ 'package_length', 'package_width', 'package_height' ] ) );
		expect( headers ).not.toEqual( expect.arrayContaining( [ 'length', 'depth', 'height' ] ) );
	} );

	it( 'approves exactly the five explicit runtime candidates', () => {
		expect( rows.filter( ( row ) => row.runtime_candidate === 'approved_initial' ).map( ( row ) => row.part_number ) ).toEqual( SHELVES.map( ( shelf ) => shelf.sku ) );
	} );

	it( 'uses the deterministic classifier for every registered row', () => {
		for ( const row of rows ) {
			expect( row.category_candidate ).toBe( classifyWestcanProduct( row.part_number, row.source_name ) );
		}
	} );
} );

describe( 'Westcan intake classification', () => {
	const cases: Array< [ string, string, WestcanCategoryCandidate ] > = [
		[ '22-3438', '3 Shelf Unit', 'shelving' ],
		[ '22-3438', '3 Shelves Unit', 'shelving' ],
		[ 'A', 'Composite Partition', 'partition' ],
		[ 'B', 'Ladder Rack', 'ladder_rack' ],
		[ 'B2', 'Double Ladder Racks', 'ladder_rack' ],
		[ 'C', 'Mounting Kit', 'mounting_kit' ],
		[ 'C2', 'Shelf Mounting Kits', 'mounting_kit' ],
		[ 'E', 'Drawer Units', 'drawer' ],
		[ 'F', 'Security Cabinets with Shelves', 'cabinet' ],
		[ 'G', 'Interior Wall Liners', 'liner' ],
		[ 'H', 'Utility Hooks', 'accessory' ],
		[ 'I', 'Shelf Mounted Ladder Hangers', 'accessory' ],
		[ 'J', 'Tool Holders and Dividers', 'accessory' ],
		[ 'D', 'Unclear Product', 'unknown' ],
	];
	it.each( cases )( 'classifies %s deterministically', ( part, name, expected ) => {
		expect( classifyWestcanProduct( part, name ) ).toBe( expected );
		expect( classifyWestcanProduct( part, name ) ).toBe( expected );
	} );
} );

describe( 'runtime Westcan catalog', () => {
	it( 'contains only the five verified empty-start products', () => {
		expect( SHELVES ).toHaveLength( 5 );
		expect( INITIAL_PLACEMENTS ).toEqual( [] );
		expect( SHELVES.map( ( shelf ) => [ shelf.sku, shelf.name, shelf.length ] ) ).toEqual( [
			[ '22-3436', 'Westcan 3-Shelf Unit · 24" · 62" H', 24 ],
			[ '22-3437', 'Westcan 3-Shelf Unit · 36" · 62" H', 36 ],
			[ '22-3438', 'Westcan 3-Shelf Unit · 48" · 62" H', 48 ],
			[ '22-3439', 'Westcan 3-Shelf Unit · 60" · 62" H', 60 ],
			[ '22-3440', 'Westcan 3-Shelf Unit · 72" · 62" H', 72 ],
		] );
		for ( const shelf of SHELVES ) {
			expect( Object.keys( shelf ).sort() ).toEqual( [
				'category', 'compatibleRoof', 'compatibleVehicleIds', 'compatibleWalls',
				'depth', 'height', 'length', 'name', 'sku', 'tiers', 'weight',
			].sort() );
			expect( shelf.weight ).toBeNull();
			expect( shelf.depth ).toBe( 16.125 );
			expect( shelf.height ).toBe( 62 );
			expect( shelf.tiers ).toBe( 3 );
			expect( shelf.compatibleWalls ).toEqual( [ 'driver', 'passenger' ] );
			expect( shelf.compatibleRoof ).toEqual( [ 'high' ] );
			expect( shelf.compatibleVehicleIds ).toEqual( [ 'sprinter-144-high-roof', 'sprinter-170-high-roof' ] );
		}
	} );

	it( 'documents the source date and installed-dimension page', () => {
		const readme = fs.readFileSync( path.join( root, 'docs/data-intake/westcan-products/README.md' ), 'utf8' );
		expect( readme ).toContain( '2026-07-21' );
		expect( readme ).toContain( 'page 14' );
	} );

	it( 'keeps product-card and incomplete-weight UI copy explicit', () => {
		const productRail = fs.readFileSync( path.join( root, 'assets/src/components/ConfigurationRail.tsx' ), 'utf8' );
		const buildSheet = fs.readFileSync( path.join( root, 'assets/src/components/BuildSheetRail.tsx' ), 'utf8' );
		expect( productRail ).toContain( 'component.height' );
		expect( productRail ).toContain( 'component.tiers' );
		expect( productRail ).toContain( 'Weight unavailable' );
		expect( buildSheet ).toContain( "? 'Incomplete'" );
	} );

	it( 'formats only verified product-card weights numerically', () => {
		expect( formatComponentWeight( null ) ).toBe( 'Weight unavailable' );
		expect( formatComponentWeight( 83 ) ).toBe( '83 lb' );
		expect( formatComponentWeight( null ) ).not.toBe( '0 lb' );
	} );

	it( 'matches both configuration 1.0 SKU allowlists', () => {
		const runtime = SHELVES.map( ( shelf ) => shelf.sku );
		for ( const filename of [ 'data/configuration-schema.json', 'data/schemas/configuration-1.0.schema.json' ] ) {
			const schema = JSON.parse( fs.readFileSync( path.join( root, filename ), 'utf8' ) );
			const placement = schema.properties.placements.items;
			expect( placement.properties.sku.enum ).toEqual( runtime );
		}
	} );
} );
