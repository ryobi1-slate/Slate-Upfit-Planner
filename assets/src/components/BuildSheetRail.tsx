/**
 * Right build-sheet rail: fit status, wall usage, payload, and the issue list.
 */

import { usePlanner } from '../hooks/usePlanner';
import type { FitmentSeverity } from '../types';

function fitStatus( issues: { severity: FitmentSeverity }[] ): {
	label: string;
	kind: FitmentSeverity | 'ok';
} {
	if ( issues.some( ( i ) => i.severity === 'error' ) ) {
		return { label: 'Resolve fit conflicts', kind: 'error' };
	}
	if ( issues.some( ( i ) => i.severity === 'warning' ) ) {
		return { label: 'Fits with warnings', kind: 'warning' };
	}
	return { label: 'Layout fits', kind: 'ok' };
}

export function BuildSheetRail() {
	const { state, totals, issues } = usePlanner();
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
							No fitment issues · { state.placements.length }{ ' ' }
							components placed.
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
				<h2 className="sup-panel__title">Wall Usage</h2>
				{ totals.wallUsage.map( ( usage ) => (
					<div className="sup-stat" key={ usage.wall }>
						<span className="sup-stat__label">
							{ usage.wall } · { usage.usedLength }&quot; used ·{ ' ' }
							{ usage.availableLength }&quot; free
						</span>
						<span className="sup-stat__value">
							{ Math.round( usage.utilization * 100 ) }%
						</span>
					</div>
				) ) }
			</section>

			<section className="sup-panel">
				<h2 className="sup-panel__title">Payload</h2>
				<div className="sup-stat">
					<span className="sup-stat__label">Component weight</span>
					<span className="sup-stat__value">
						{ payload.componentWeight } lb
					</span>
				</div>
				{ state.vehicle.payloadRequiresVin ? (
					<p className="sup-issue sup-issue--warning">
						VIN required to display chassis capacity and remaining
						payload.
					</p>
				) : (
					<>
						<div className="sup-stat">
							<span className="sup-stat__label">
								Chassis capacity
							</span>
							<span className="sup-stat__value">
								{ payload.capacity } lb
							</span>
						</div>
						<div className="sup-stat">
							<span className="sup-stat__label">Remaining</span>
							<span
								className={
									'sup-stat__value' +
									( payload.overCapacity
										? ' sup-stat__value--bad'
										: '' )
								}
							>
								{ payload.remaining } lb
							</span>
						</div>
					</>
				) }
				{ ! state.vehicle.payloadRequiresVin &&
					payload.overCapacity && (
						<p className="sup-issue sup-issue--error">
							Over payload — chassis upgrade required.
						</p>
					) }
			</section>
		</aside>
	);
}
