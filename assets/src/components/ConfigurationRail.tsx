/**
 * Left configuration rail: vehicle, wall, and catalog product selection.
 */

import { usePlanner } from '../hooks/usePlanner';
import type { WallId } from '../types';

export function ConfigurationRail() {
	const { state, catalog, selectWall, selectProduct, placeComponent } =
		usePlanner();

	return (
		<aside className="sup-rail" aria-label="Configuration">
			<section className="sup-panel">
				<h2 className="sup-panel__title">Vehicle</h2>
				<p className="sup-panel__hint">
					Placeholder catalog for Phase 1.
				</p>

				<div className="sup-field">
					<label className="sup-field__label" htmlFor="sup-vehicle">
						Chassis
					</label>
					<select
						id="sup-vehicle"
						className="sup-select"
						value={ state.vehicle.id }
						disabled
					>
						<option value={ state.vehicle.id }>
							{ state.vehicle.name }
						</option>
					</select>
				</div>

				<div className="sup-field">
					<span className="sup-field__label">Wall</span>
					<div className="sup-wall-tabs">
						{ state.vehicle.walls.map( ( wall ) => (
							<button
								key={ wall.id }
								type="button"
								className={
									'sup-wall-tab' +
									( state.activeWall === wall.id
										? ' sup-wall-tab--active'
										: '' )
								}
								onClick={ () =>
									selectWall( wall.id as WallId )
								}
							>
								{ wall.label }
							</button>
						) ) }
					</div>
				</div>
			</section>

			<section className="sup-panel">
				<h2 className="sup-panel__title">Products</h2>
				<p className="sup-panel__hint">
					Select a SKU, then add it to the active wall.
				</p>

				<div className="sup-catalog">
					{ catalog.map( ( component ) => {
						const selected = state.selectedSku === component.sku;
						return (
							<button
								key={ component.sku }
								type="button"
								className={
									'sup-card' +
									( selected ? ' sup-card--selected' : '' )
								}
								onClick={ () => {
									const nextSelected = ! selected;
									selectProduct(
										nextSelected ? component.sku : null
									);
									// Only place when selecting, never on deselect.
									if ( nextSelected && state.activeWall ) {
										placeComponent(
											component.sku,
											state.activeWall
										);
									}
								} }
							>
								<span>
									<span className="sup-card__name">
										{ component.name }
									</span>
									<br />
									<span className="sup-card__meta">
										{ component.width }×{ component.height }{ ' ' }
										mm · { component.weight } kg
									</span>
								</span>
								<span className="sup-card__value">
									${ component.listValue }
								</span>
							</button>
						);
					} ) }
				</div>
			</section>
		</aside>
	);
}
