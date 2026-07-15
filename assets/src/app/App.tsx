/**
 * Product shell composition: top nav + three-column body
 * (configuration rail · canvas workspace · build-sheet rail).
 *
 * Phase 1 renders the shell against placeholder data. The full planner behavior
 * is layered in behind the existing state/engine boundaries in later phases.
 */

import { PlannerProvider } from '../state/context';
import { TopNav } from '../components/TopNav';
import { ConfigurationRail } from '../components/ConfigurationRail';
import { CanvasWorkspace } from '../components/CanvasWorkspace';
import { BuildSheetRail } from '../components/BuildSheetRail';
import { getBootstrapContext } from '../services/bootstrap';
import {
	COMPONENTS_BY_SKU,
	INITIAL_PLACEMENTS,
	SPRINTER_144,
} from '../data/placeholder';

export function App() {
	const ctx = getBootstrapContext();

	return (
		<PlannerProvider
			init={ {
				vehicle: SPRINTER_144,
				componentsBySku: COMPONENTS_BY_SKU,
				placements: INITIAL_PLACEMENTS,
				activeWall: 'driver',
			} }
		>
			<div className="sup-shell">
				<TopNav mode={ ctx.mode } />
				<div className="sup-body">
					<ConfigurationRail />
					<CanvasWorkspace />
					<BuildSheetRail />
				</div>
			</div>
		</PlannerProvider>
	);
}
