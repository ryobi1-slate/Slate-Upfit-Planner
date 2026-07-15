/**
 * Center canvas workspace. Phase 1 renders a simplified schematic of the active
 * wall with placed components positioned by their engine-computed x offset. The
 * full interactive drag/drop canvas is ported in a later phase.
 */

import { usePlanner } from '../hooks/usePlanner';

const SCALE = 0.18; // mm -> px for the placeholder stage.

export function CanvasWorkspace() {
	const { state, removeComponent } = usePlanner();

	const activeWall = state.vehicle.walls.find(
		( w ) => w.id === state.activeWall
	);

	const placements = state.placements.filter(
		( p ) => p.wall === state.activeWall
	);

	return (
		<section className="sup-panel sup-canvas" aria-label="Canvas workspace">
			<div className="sup-canvas__header">
				<h2 className="sup-panel__title">
					{ state.vehicle.name } —{ ' ' }
					{ activeWall?.label ?? 'No wall selected' }
				</h2>
				<span className="sup-card__meta">
					{ placements.length } placed
				</span>
			</div>

			<div className="sup-canvas__stage">
				{ placements.map( ( placement ) => {
					const component = state.componentsBySku[ placement.sku ];
					if ( ! component ) {
						return null;
					}
					return (
						<div
							key={ placement.id }
							className="sup-placement"
							style={ {
								left: `${ placement.position.x * SCALE }px`,
								width: `${ component.width * SCALE }px`,
							} }
							title={ component.name }
						>
							{ component.name }
							<button
								type="button"
								className="sup-placement__remove"
								aria-label={ `Remove ${ component.name }` }
								onClick={ () =>
									removeComponent( placement.id )
								}
							>
								×
							</button>
						</div>
					);
				} ) }
			</div>
		</section>
	);
}
