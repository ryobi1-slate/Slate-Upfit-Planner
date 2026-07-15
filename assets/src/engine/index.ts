/**
 * Fitment engine public surface. Import from `../engine` rather than reaching
 * into individual modules so the boundary stays stable as internals evolve.
 */

export {
	getPlacementBounds,
	overlaps,
	getHardBlocks,
	intersectsBlockedZone,
	edgeInsideWheelWell,
	snapToIncrement,
	clampPlacement,
	findOpenPlacement,
	getOpenRuns,
	getRemainingWallLength,
	calculateWallUsage,
} from './geometry';

export {
	validatePlacement,
	checkPlacement,
	validateConfiguration,
	toFitmentResult,
} from './fitment';

export {
	calculatePayload,
	calculateTotals,
	buildNormalizedPayload,
} from './payload';
