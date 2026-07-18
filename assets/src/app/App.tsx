/**
 * Product shell composition: top nav + three-column body
 * (configuration rail · canvas workspace · build-sheet rail).
 *
 * Phase 2 renders the Stitch shell with the real interactive driver/passenger
 * wall canvas and fitment engine, against the fixed Westcan shelf catalog and
 * Sprinter 144 geometry.
 */

import { PlannerProvider } from '../state/context';
import { TopNav } from '../components/TopNav';
import { ConfigurationRail } from '../components/ConfigurationRail';
import { CanvasWorkspace } from '../components/CanvasWorkspace';
import { BuildSheetRail } from '../components/BuildSheetRail';
import { getBootstrapContext } from '../services/bootstrap';
import { SPRINTER_144_HR } from '../data/geometry';
import { COMPONENTS_BY_SKU, INITIAL_PLACEMENTS } from '../data/catalog';

export function App() {
	const ctx = getBootstrapContext();

	return (
		<PlannerProvider
			init={ {
				vehicle: SPRINTER_144_HR,
				componentsBySku: COMPONENTS_BY_SKU,
				placements: INITIAL_PLACEMENTS,
				activeWall: 'driver',
			} }
		>
			<div className="sup-shell">
				<TopNav mode={ ctx.mode } />
				<div className="sup-planning-warning" role="status">
					Planning geometry only — production use is not authorized.
					VIN payload is required.
				</div>
				<div className="sup-body">
					<ConfigurationRail />
					<CanvasWorkspace />
					<BuildSheetRail />
				</div>
			</div>
		</PlannerProvider>
	);
}
