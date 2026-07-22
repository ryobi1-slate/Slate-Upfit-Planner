/**
 * Center canvas workspace — hosts the interactive wall canvas plus a header
 * (active wall + placement count) and the legend.
 */

import { usePlanner } from '../hooks/usePlanner';
import { WallCanvas } from './canvas/WallCanvas';
import { CanvasLegend } from './canvas/CanvasLegend';

export function CanvasWorkspace() {
	const { state, activeWallGeometry } = usePlanner();
	const onWall = state.placements.filter(
		( p ) => p.wall === state.activeWall
	);

	return (
		<section className="sup-panel sup-canvas" aria-label="Canvas workspace">
			<div className="sup-canvas__header">
				<div>
					<p className="sup-section-heading__kicker">
						Technical wall plan
					</p>
					<h2>
						{ state.vehicle.name } —{ ' ' }
						{ activeWallGeometry?.label ?? 'No wall' }
					</h2>
				</div>
				<span className="sup-canvas__count">
					{ onWall.length } placed · 1&quot; snap
				</span>
			</div>

			<div className="sup-canvas__stage">
				<WallCanvas />
			</div>

			<CanvasLegend />
		</section>
	);
}
