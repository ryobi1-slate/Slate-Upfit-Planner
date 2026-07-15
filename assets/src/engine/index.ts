/**
 * Fitment engine public surface. Import from `../engine` rather than reaching
 * into individual modules so the boundary stays stable as internals are ported.
 */

export { findOpenPlacement, calculateWallUsage } from './geometry';
export { validatePlacement, validateConfiguration } from './fitment';
export {
	calculatePayload,
	calculatePackageValue,
	calculateTotals,
	buildNormalizedPayload,
} from './payload';
