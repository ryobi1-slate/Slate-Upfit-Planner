/**
 * Vehicle controls and approved-equipment catalog.
 * Selecting a product arms it for placement (hover + click on the canvas), and
 * "Add" auto-places it at the first legal open spot.
 */

import { usePlanner } from '../hooks/usePlanner';
import { PLANNING_GEOMETRY_WARNING } from '../data/geometry';
import type { PlannerComponent, WallId } from '../types';
import { BuildSheetIntake } from './BuildSheetIntake';

/**
 * Format only verified component weights for catalog display.
 *
 * @param weight Verified weight or null when unavailable.
 */
export function formatComponentWeight(
	weight: PlannerComponent[ 'weight' ]
): string {
	return weight === null ? 'Weight unavailable' : `${ weight } lb`;
}

export function ConfigurationRail() {
	const {
		state,
		catalog,
		supportedVehicles,
		remainingOnActiveWall,
		selectVehicle,
		selectProduct,
		switchWall,
		placeSelected,
		clearWall,
	} = usePlanner();
	const { vehicle, activeWall, selectedSku } = state;

	return (
		<aside className="sup-configuration" aria-label="Configuration">
			<BuildSheetIntake />
			<section className="sup-panel sup-controls">
				<h2 className="sup-panel__title">Vehicle</h2>
				<label className="sup-field" htmlFor="sup-vehicle-selector">
					<span className="sup-field__label">
						Vehicle configuration
					</span>
					<select
						id="sup-vehicle-selector"
						className="sup-vehicle-selector"
						value={ vehicle.id }
						onChange={ ( event ) =>
							selectVehicle( event.currentTarget.value )
						}
					>
						{ supportedVehicles.map( ( option ) => (
							<option key={ option.id } value={ option.id }>
								{ option.name }
							</option>
						) ) }
					</select>
				</label>
				<p className="sup-panel__hint sup-controls__change-note">
					Changing vehicles clears the current layout.
				</p>
				<p className="sup-panel__hint sup-controls__vehicle-meta">
					{ vehicle.name } · { vehicle.length }&quot; ×{ ' ' }
					{ vehicle.width }&quot; ·{ ' ' }
					{ vehicle.payloadCapacity === null
						? 'Payload requires VIN'
						: `${ vehicle.payloadCapacity } lb payload` }
				</p>
				<p className="sup-planning-warning">
					{ PLANNING_GEOMETRY_WARNING }
				</p>

				<div className="sup-field">
					<span className="sup-field__label">Wall to configure</span>
					<div className="sup-wall-tabs" role="tablist">
						{ vehicle.walls.map( ( w ) => (
							<button
								key={ w.wall }
								type="button"
								role="tab"
								aria-selected={ activeWall === w.wall }
								className={
									'sup-wall-tab' +
									( activeWall === w.wall
										? ' sup-wall-tab--active'
										: '' )
								}
								onClick={ () => switchWall( w.wall as WallId ) }
							>
								{ w.label }
							</button>
						) ) }
					</div>
				</div>
				<p className="sup-panel__hint sup-controls__remaining">
					{ Math.max( 0, Math.round( remainingOnActiveWall ) ) }&quot;
					mountable length remaining on this wall.
				</p>
			</section>

			<section className="sup-panel sup-products">
				<div className="sup-section-heading">
					<div>
						<p className="sup-section-heading__kicker">
							Approved equipment
						</p>
						<h2>Product catalog</h2>
					</div>
				</div>
				<p className="sup-panel__hint">
					Select a shelf, then click the plan to place it — or use Add
					to Plan.
				</p>

				<div className="sup-catalog">
					{ catalog.map( ( component ) => {
						const selected = state.selectedSku === component.sku;
						return (
							<div
								key={ component.sku }
								className={
									'sup-card' +
									( selected ? ' sup-card--selected' : '' )
								}
							>
								<button
									type="button"
									className="sup-card__select"
									aria-pressed={ selected }
									onClick={ () =>
										selectProduct(
											selected ? null : component.sku
										)
									}
								>
									<span className="sup-card__name">
										{ component.name }
									</span>
									<span className="sup-card__meta">
										{ component.sku } · { component.length }
										&quot; L × { component.depth }&quot; D ×{ ' ' }
										{ component.height }&quot; H ·{ ' ' }
										{ component.tiers } shelves
										<br />
										{ formatComponentWeight(
											component.weight
										) }
									</span>
								</button>
								<button
									type="button"
									className="sup-card__add"
									aria-label={ `Add ${ component.name } to ${ activeWall } wall` }
									onClick={ () => {
										selectProduct( component.sku );
										placeSelected(
											activeWall,
											undefined,
											component.sku
										);
									} }
								>
									Add to Plan
								</button>
							</div>
						);
					} ) }
				</div>

				<button
					type="button"
					className="sup-clear-wall"
					onClick={ () => clearWall( activeWall ) }
				>
					Clear { activeWall } wall
				</button>
				{ selectedSku && (
					<p className="sup-panel__hint">
						{ state.componentsBySku[ selectedSku ]?.name } armed —
						click the canvas to place.
					</p>
				) }
			</section>
		</aside>
	);
}
