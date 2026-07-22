/**
 * Renders the fixed keep-out geometry for a wall: partition + no-mount zones,
 * the sliding-door opening, and wheel wells. Presentational only.
 */

import type { BlockedZone, WallGeometry } from '../../types';
import type { CanvasScale } from './scale';

function zoneLabel( z: BlockedZone ): string {
	if ( z.kind === 'partition' ) {
		return 'PARTITION';
	}
	return z.inset ? `${ z.inset }" DNE` : 'NO-MOUNT';
}

export function ZoneOverlay( {
	wall,
	scale,
}: {
	wall: WallGeometry;
	scale: CanvasScale;
} ) {
	const { U, laneTop, laneHeight, pxPerIn } = scale;
	const laneBottom = laneTop + laneHeight;

	return (
		<g className="sup-zones" aria-hidden="true" pointerEvents="none">
			{ /* No-mount + partition zones (hatched) */ }
			{ wall.blockedZones.map( ( z, i ) => (
				<g key={ `bz-${ i }` }>
					<rect
						x={ U( z.from ) }
						y={ laneTop }
						width={ ( z.to - z.from ) * pxPerIn }
						height={ laneHeight }
						fill="url(#supHatch)"
						stroke="var(--slate-line)"
						strokeWidth={ z.kind === 'partition' ? 1.5 : 0.75 }
					/>
					<text
						x={ U( ( z.from + z.to ) / 2 ) }
						y={ laneTop + laneHeight / 2 }
						textAnchor="middle"
						className="sup-zone-label"
						transform={ `rotate(-90, ${ U(
							( z.from + z.to ) / 2
						) }, ${ laneTop + laneHeight / 2 })` }
					>
						{ zoneLabel( z ) }
					</text>
				</g>
			) ) }

			{ /* Sliding-door opening — dashed gap on the wall edge */ }
			{ wall.doorZones.map( ( d, i ) => (
				<g key={ `dz-${ i }` }>
					<line
						x1={ U( d.from ) }
						y1={ laneTop }
						x2={ U( d.to ) }
						y2={ laneTop }
						stroke="var(--slate-line)"
						strokeWidth="1"
						strokeDasharray="4 3"
					/>
					<rect
						x={ U( d.from ) }
						y={ laneTop }
						width={ ( d.to - d.from ) * pxPerIn }
						height={ laneHeight }
						fill="rgba(178, 59, 46, 0.05)"
					/>
					<text
						x={ U( ( d.from + d.to ) / 2 ) }
						y={ laneTop + 12 }
						textAnchor="middle"
						className="sup-zone-label"
					>
						SLIDING DOOR
					</text>
				</g>
			) ) }

			{ /* Wheel wells (soft) — filled boxes on the wall edge */ }
			{ wall.wheelWells.map( ( w, i ) => (
				<g key={ `ww-${ i }` }>
					<rect
						x={ U( w.from ) }
						y={ laneBottom - w.depth * pxPerIn }
						width={ ( w.to - w.from ) * pxPerIn }
						height={ w.depth * pxPerIn }
						fill="var(--slate-wheel)"
						stroke="var(--slate-line)"
						strokeWidth="1"
					/>
					<text
						x={ U( ( w.from + w.to ) / 2 ) }
						y={ laneBottom - ( w.depth * pxPerIn ) / 2 + 3 }
						textAnchor="middle"
						className="sup-zone-label"
					>
						WHEEL WELL
					</text>
				</g>
			) ) }
		</g>
	);
}
