/** Dominant combined technical-plan workspace. */
import { usePlanner } from '../hooks/usePlanner';
import { FullPlanCanvas } from './canvas/FullPlanCanvas';
import { CanvasLegend } from './canvas/CanvasLegend';

export function CanvasWorkspace() {
	const { state } = usePlanner();
	return (
		<section className="sup-panel sup-canvas" aria-label="Canvas workspace">
			<div className="sup-canvas__header">
				<div>
					<p className="sup-section-heading__kicker">
						Technical vehicle plan
					</p>
					<h2>{ state.vehicle.name } — Full cargo plan</h2>
				</div>
				<span className="sup-canvas__count">
					{ state.placements.length } placed · 1&quot; snap
				</span>
			</div>
			<div className="sup-canvas__stage">
				<FullPlanCanvas />
			</div>
			<CanvasLegend />
		</section>
	);
}
