/**
 * Canvas scale + coordinate transforms for the single-wall view. Pure — the
 * only place inches are converted to pixels. Horizontal projection: front at
 * left, rear at right; the wall runs left→right, cabin depth runs top→down.
 */

import type { Inches, WallGeometry } from '../../types';

export interface CanvasScale {
	pxPerIn: number;
	marginL: number;
	marginTop: number;
	laneTop: number;
	laneHeight: number;
	svgW: number;
	svgH: number;
	/** Inches-from-front → x pixels. */
	U: ( inch: Inches ) => number;
	/** Depth-from-wall (inches) → y pixels. */
	D: ( depthIn: Inches ) => number;
}

/** Depth band drawn for the wall lane (a little deeper than a shelf). */
const LANE_DEPTH_IN = 20;
const MARGIN_L = 52;
const MARGIN_TOP = 52;
const MARGIN_R = 72;
const MARGIN_BOTTOM = 58;

export function createWallScale(
	wall: WallGeometry,
	pxPerIn: number
): CanvasScale {
	const laneHeight = LANE_DEPTH_IN * pxPerIn;
	const svgW = MARGIN_L + wall.length * pxPerIn + MARGIN_R;
	const svgH = MARGIN_TOP + laneHeight + MARGIN_BOTTOM;
	return {
		pxPerIn,
		marginL: MARGIN_L,
		marginTop: MARGIN_TOP,
		laneTop: MARGIN_TOP,
		laneHeight,
		svgW,
		svgH,
		U: ( inch: Inches ) => MARGIN_L + inch * pxPerIn,
		D: ( depthIn: Inches ) => MARGIN_TOP + depthIn * pxPerIn,
	};
}
