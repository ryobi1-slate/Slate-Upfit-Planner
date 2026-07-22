/**
 * Ghost preview of the selected product at the pointer position. Shows whether
 * the spot is valid (accent) or conflicting (warn). Presentational only.
 */

import type { PlannerComponent } from '../../types';
import type { CanvasScale } from './scale';

export function PlacementPreview( {
	component,
	positionX,
	scale,
	valid,
}: {
	component: PlannerComponent;
	positionX: number;
	scale: CanvasScale;
	valid: boolean;
} ) {
	const { U, laneTop, pxPerIn } = scale;
	const x = U( positionX );
	const y = laneTop;
	const w = component.length * pxPerIn;
	const h = component.depth * pxPerIn;

	return (
		<g
			className={ `sup-preview${ valid ? '' : ' sup-preview--invalid' }` }
			aria-hidden="true"
			pointerEvents="none"
		>
			<rect
				className="sup-preview-fill"
				x={ x }
				y={ y }
				width={ w }
				height={ h }
			/>
			<rect
				className="sup-preview-outline"
				x={ x }
				y={ y }
				width={ w }
				height={ h }
			/>
			<text
				x={ x + w / 2 }
				y={ y + h / 2 + 3 }
				textAnchor="middle"
				className="sup-preview-label"
			>
				{ valid ? '+ PLACE' : 'BLOCKED' }
			</text>
		</g>
	);
}
