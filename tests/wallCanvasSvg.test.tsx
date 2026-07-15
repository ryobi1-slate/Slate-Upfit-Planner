import { describe, expect, it } from '@jest/globals';
import { Children, isValidElement, type ReactNode } from 'react';

import { WallCanvasSvg } from '../assets/src/components/canvas/WallCanvasSvg';
import { createWallScale } from '../assets/src/components/canvas/scale';
import type { WallGeometry } from '../assets/src/types';

function findTextByClassName(
	node: ReactNode,
	className: string
): string | undefined {
	for ( const child of Children.toArray( node ) ) {
		if ( ! isValidElement<{ className?: string; children?: ReactNode }>( child ) ) {
			continue;
		}
		if ( child.props.className === className ) {
			return Children.toArray( child.props.children ).join( '' );
		}
		const nested = findTextByClassName( child.props.children, className );
		if ( nested !== undefined ) {
			return nested;
		}
	}

	return undefined;
}

describe( 'WallCanvasSvg', () => {
	it( 'renders the remaining measurement without whitespace before the inch symbol', () => {
		const wall: WallGeometry = {
			wall: 'driver',
			label: 'Driver Wall',
			length: 120,
			partition: 8,
			blockedZones: [],
			doorZones: [],
			wheelWells: [],
		};
		const canvas = WallCanvasSvg( {
			wall,
			scale: createWallScale( wall, 5 ),
			remaining: 10,
		} );
		const label = findTextByClassName( canvas, 'sup-remain-label' );

		expect( label ).toBe( 'DRIVER WALL REMAIN 10"' );
	} );
} );
