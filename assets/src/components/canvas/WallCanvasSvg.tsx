/**
 * Static rendering chrome for the wall canvas: grid, wall-lane shell, front/rear
 * labels, ruler ticks, cargo-length dimension line, and the remaining-length
 * badge. Presentational only.
 */

import type { WallGeometry } from '../../types';
import type { CanvasScale } from './scale';

export function WallCanvasSvg( {
	wall,
	scale,
	remaining,
}: {
	wall: WallGeometry;
	scale: CanvasScale;
	remaining: number;
} ) {
	const { U, laneTop, laneHeight, svgW, pxPerIn } = scale;
	const laneBottom = laneTop + laneHeight;
	const laneRight = U( wall.length );

	const ticks: number[] = [];
	for ( let i = 0; i <= wall.length; i += 12 ) {
		ticks.push( i );
	}

	return (
		<g aria-hidden="true">
			{ /* Grid inside the lane */ }
			<rect
				x={ U( 0 ) }
				y={ laneTop }
				width={ wall.length * pxPerIn }
				height={ laneHeight }
				fill="url(#supGrid)"
			/>

			{ /* Wall lane shell */ }
			<rect
				className="sup-lane-shell"
				x={ U( 0 ) }
				y={ laneTop }
				width={ wall.length * pxPerIn }
				height={ laneHeight }
			/>

			{ /* FRONT / REAR edge labels */ }
			<text
				x={ U( 0 ) }
				y={ laneTop - 14 }
				textAnchor="start"
				className="sup-edge-label"
			>
				FRONT
			</text>
			<text
				x={ laneRight }
				y={ laneTop - 14 }
				textAnchor="end"
				className="sup-edge-label"
			>
				REAR
			</text>
			<line
				x1={ laneRight }
				y1={ laneTop }
				x2={ laneRight }
				y2={ laneBottom }
				className="sup-rear-line"
			/>

			{ /* Ruler ticks every 12" (labels every 24") */ }
			{ ticks.map( ( t ) => (
				<g key={ t }>
					<line
						x1={ U( t ) }
						y1={ laneTop - 4 }
						x2={ U( t ) }
						y2={ laneTop }
						className="sup-tick"
					/>
					{ t % 24 === 0 && (
						<text
							x={ U( t ) }
							y={ laneTop - 6 }
							textAnchor="middle"
							className="sup-tick-label"
						>
							{ t }&quot;
						</text>
					) }
				</g>
			) ) }

			{ /* Cargo-length dimension line below the lane */ }
			<g>
				<line
					x1={ U( 0 ) }
					y1={ laneBottom + 22 }
					x2={ laneRight }
					y2={ laneBottom + 22 }
					className="sup-dim-line"
				/>
				<line
					x1={ U( 0 ) }
					y1={ laneBottom + 18 }
					x2={ U( 0 ) }
					y2={ laneBottom + 26 }
					className="sup-dim-line"
				/>
				<line
					x1={ laneRight }
					y1={ laneBottom + 18 }
					x2={ laneRight }
					y2={ laneBottom + 26 }
					className="sup-dim-line"
				/>
				<text
					x={ ( U( 0 ) + laneRight ) / 2 }
					y={ laneBottom + 38 }
					textAnchor="middle"
					className="sup-dim-label"
				>
					{ wall.length }&quot; CARGO LENGTH
				</text>
			</g>

			{ /* Remaining-length badge */ }
			<g transform={ `translate(${ svgW - 150 }, ${ laneBottom + 12 })` }>
				<rect
					className="sup-remain-badge"
					x="0"
					y="0"
					width="132"
					height="18"
				/>
				<text
					x="66"
					y="12"
					textAnchor="middle"
					className="sup-remain-label"
				>
					{ wall.label.toUpperCase() } REMAIN{ ' ' }
					{ Math.max( 0, Math.round( remaining ) ) }&quot;
				</text>
			</g>
		</g>
	);
}
