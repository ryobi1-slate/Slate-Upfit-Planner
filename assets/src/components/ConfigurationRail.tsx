/**
 * Left configuration rail: vehicle summary, wall switch, and the shelf catalog.
 * Selecting a product arms it for placement (hover + click on the canvas), and
 * "Add" auto-places it at the first legal open spot.
 */

import { usePlanner } from '../hooks/usePlanner';
import { VEHICLES } from '../data/geometry';
import type { WallId } from '../types';

export function ConfigurationRail() {
	const {
		state,
		catalog,
		remainingOnActiveWall,
		selectVehicle,
		selectProduct,
		switchWall,
		placeSelected,
		clearWall,
	} = usePlanner();
	const { vehicle, activeWall, selectedSku } = state;

	return (
		<aside className="sup-rail" aria-label="Configuration">
			<section className="sup-panel">
				<h2 className="sup-panel__title">Vehicle</h2>
				<label className="sup-field" htmlFor="sup-vehicle-selector">
					<span className="sup-field__label">
						Vehicle configuration
					</span>
					<select
						id="sup-vehicle-selector"
						className="sup-vehicle-selector"
						value={ vehicle.id }
						onChange={ ( event ) => {
							const nextVehicle = VEHICLES.find(
								( option ) =>
									option.id === event.currentTarget.value
							);
							if ( nextVehicle ) {
								selectVehicle( nextVehicle );
							}
						} }
					>
						{ VEHICLES.map( ( option ) => (
							<option key={ option.id } value={ option.id }>
								{ option.name }
							</option>
						) ) }
					</select>
				</label>
				<p className="sup-panel__hint">
					{ vehicle.name } · { vehicle.length }&quot; ×{ ' ' }
					{ vehicle.width }&quot; ·{ ' ' }
					{ vehicle.payloadRequiresVin
						? 'VIN required for payload capacity'
						: `${ vehicle.payloadCapacity } lb payload` }
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
				<p className="sup-panel__hint">
					{ Math.max( 0, Math.round( remainingOnActiveWall ) ) }&quot;
					mountable length remaining on this wall.
				</p>
			</section>

			<section className="sup-panel">
				<h2 className="sup-panel__title">Shelves</h2>
				<p className="sup-panel__hint">
					Select a shelf, then click the canvas to place — or use Add.
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
										&quot; L × { component.depth }&quot; D ·{ ' ' }
										{ component.weight } lb
									</span>
								</button>
								<button
									type="button"
									className="sup-card__add"
									aria-label={ `Add ${ component.name } to ${ activeWall } wall` }
									onClick={ () => {
										selectProduct( component.sku );
										placeSelected( activeWall );
									} }
								>
									+ Add
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
