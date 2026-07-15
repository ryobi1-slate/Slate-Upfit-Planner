/**
 * Right build-sheet rail: fit status, wall usage, payload, issues, and the
 * placeholder package value.
 */

import { useMemo } from '@wordpress/element';
import { usePlanner } from '../hooks/usePlanner';
import { validateConfiguration } from '../engine';
import type { FitmentSeverity } from '../types';

function fitStatus( issues: { severity: FitmentSeverity }[] ): {
	label: string;
	kind: FitmentSeverity | 'ok';
} {
	if ( issues.some( ( i ) => i.severity === 'error' ) ) {
		return { label: 'Does not fit', kind: 'error' };
	}
	if ( issues.some( ( i ) => i.severity === 'warning' ) ) {
		return { label: 'Fits with warnings', kind: 'warning' };
	}
	return { label: 'Fits', kind: 'ok' };
}

export function BuildSheetRail() {
	const { state, totals } = usePlanner();

	const issues = useMemo(
		() =>
			validateConfiguration(
				state.vehicle,
				state.placements,
				state.componentsBySku
			),
		[ state.vehicle, state.placements, state.componentsBySku ]
	);

	const status = fitStatus( issues );
	const payload = totals.payload;

	return (
		<aside className="sup-rail" aria-label="Build sheet">
			<section className="sup-panel">
				<h2 className="sup-panel__title">Fit Status</h2>
				<span className={ `sup-fit sup-fit--${ status.kind }` }>
					<span className="sup-fit__dot" />
					{ status.label }
				</span>

				<ul className="sup-issues">
					{ issues.length === 0 && (
						<li className="sup-issue sup-issue--info">
							No fitment issues.
						</li>
					) }
					{ issues.map( ( issue, index ) => (
						<li
							key={ `${ issue.code }-${ index }` }
							className={ `sup-issue sup-issue--${ issue.severity }` }
						>
							{ issue.message }
						</li>
					) ) }
				</ul>
			</section>

			<section className="sup-panel">
				<h2 className="sup-panel__title">Build Sheet</h2>

				<div className="sup-stat">
					<span className="sup-stat__label">Placed components</span>
					<span className="sup-stat__value">
						{ state.placements.length }
					</span>
				</div>
				<div className="sup-stat">
					<span className="sup-stat__label">Component weight</span>
					<span className="sup-stat__value">
						{ payload.componentWeight } kg
					</span>
				</div>
				<div className="sup-stat">
					<span className="sup-stat__label">Payload remaining</span>
					<span className="sup-stat__value">
						{ payload.remaining } kg
					</span>
				</div>

				{ totals.wallUsage.map( ( usage ) => (
					<div className="sup-stat" key={ usage.wall }>
						<span className="sup-stat__label">
							{ usage.wall } utilization
						</span>
						<span className="sup-stat__value">
							{ Math.round( usage.utilization * 100 ) }%
						</span>
					</div>
				) ) }

				<div className="sup-package-value">
					<span>Package value</span>
					<span className="sup-package-value__amount">
						${ totals.packageValue.toLocaleString() }
					</span>
				</div>
			</section>
		</aside>
	);
}
