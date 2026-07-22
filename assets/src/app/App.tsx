/**
 * Dealer Portal-aligned planner composition: page header, compact controls,
 * dominant canvas workspace, product catalog, and plan summary.
 *
 * The planning runtime supports Sprinter 144 and 170 High Roof geometry while
 * retaining the existing driver/passenger wall canvas and fitment engine.
 */

import { PlannerProvider } from '../state/context';
import { ConfigurationRail } from '../components/ConfigurationRail';
import { CanvasWorkspace } from '../components/CanvasWorkspace';
import { BuildSheetRail } from '../components/BuildSheetRail';
import { SPRINTER_144_HR } from '../data/geometry';
import { COMPONENTS_BY_SKU, INITIAL_PLACEMENTS } from '../data/catalog';

export function App() {
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
				<header className="sup-page-header">
					<div>
						<p className="sup-page-header__kicker">
							Vehicle configuration
						</p>
						<h1>Upfit Planner</h1>
						<p className="sup-page-header__description">
							Configure shelving and equipment against verified
							vehicle geometry.
						</p>
					</div>
					<p className="sup-page-header__status">Technical plan</p>
				</header>
				<div className="sup-body">
					<ConfigurationRail />
					<CanvasWorkspace />
					<BuildSheetRail />
				</div>
			</div>
		</PlannerProvider>
	);
}
