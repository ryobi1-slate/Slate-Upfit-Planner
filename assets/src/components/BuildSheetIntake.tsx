import { useMemo, useState } from '@wordpress/element';
import { usePlanner } from '../hooks/usePlanner';
import { getBootstrapContext } from '../services/bootstrap';
import { RestClient } from '../services/restClient';
import {
	matchSupportedBuildSheetVehicle,
	type BuildSheetCorrections,
	type BuildSheetIntakeResponse,
} from '../domain/buildSheetIntake';

const EDITABLE_FIELDS: Array< {
	key: keyof BuildSheetCorrections;
	label: string;
} > = [
	{ key: 'modelYear', label: 'Model year' },
	{ key: 'wheelbase', label: 'Wheelbase' },
	{ key: 'roofHeight', label: 'Roof height' },
	{ key: 'drivetrain', label: 'Drivetrain' },
	{ key: 'vehicleType', label: 'Vehicle type' },
];

function parsedValue( result: BuildSheetIntakeResponse, key: string ): string {
	const value = result.fields[ key ]?.value;
	return value === null || value === undefined ? '' : String( value );
}

export function BuildSheetIntake() {
	const { state, selectVehicle } = usePlanner();
	const client = useMemo( () => new RestClient( getBootstrapContext() ), [] );
	const [ file, setFile ] = useState< File | null >( null );
	const [ result, setResult ] = useState< BuildSheetIntakeResponse | null >(
		null
	);
	const [ corrections, setCorrections ] =
		useState< BuildSheetCorrections | null >( null );
	const [ busy, setBusy ] = useState( false );
	const [ error, setError ] = useState( '' );

	const upload = async () => {
		if ( ! file ) {
			setError( 'Choose a Mercedes build-sheet PDF.' );
			return;
		}
		setBusy( true );
		setError( '' );
		const response = await client.uploadBuildSheet( file );
		setBusy( false );
		if ( ! response.data ) {
			setError(
				response.errors[ 0 ] ?? 'Build sheet could not be read.'
			);
			return;
		}
		setResult( response.data );
		setCorrections( {
			modelYear: parsedValue( response.data, 'model_year' ),
			wheelbase: parsedValue( response.data, 'wheelbase' ),
			roofHeight: parsedValue( response.data, 'roof_height' ),
			drivetrain: parsedValue( response.data, 'drivetrain' ),
			vehicleType: parsedValue( response.data, 'vehicle_type' ),
		} );
		if ( ! response.ok ) {
			setError(
				response.data.message ??
					`Extraction status: ${ response.data.status }`
			);
		}
	};

	const matchedVehicle = corrections
		? matchSupportedBuildSheetVehicle( corrections )
		: null;
	const changingVehicle =
		matchedVehicle !== null && matchedVehicle !== state.vehicle.id;

	return (
		<section className="sup-panel sup-build-sheet-intake">
			<h2 className="sup-panel__title">Mercedes build sheet</h2>
			<p className="sup-panel__hint">
				Upload a text-based Mercedes PDF, review the detected chassis,
				then apply it explicitly.
			</p>
			<input
				aria-label="Mercedes build-sheet PDF"
				type="file"
				accept=".pdf,application/pdf"
				onChange={ ( event ) =>
					setFile( event.currentTarget.files?.[ 0 ] ?? null )
				}
			/>
			<button type="button" disabled={ busy } onClick={ upload }>
				{ busy ? 'Reading…' : 'Read build sheet' }
			</button>
			{ error && <p role="alert">{ error }</p> }
			{ result && (
				<div className="sup-build-sheet-review">
					<p>
						<strong>{ result.filename }</strong> · { result.status }
					</p>
					{ Object.entries( result.fields ).map(
						( [ key, field ] ) => (
							<div key={ key } className="sup-build-sheet-field">
								<strong>
									{ key.split( '_' ).join( ' ' ) }
								</strong>{ ' ' }
								:{ ' ' }
								{ field.value === null
									? field.status
									: String( field.value ) }
								<small>
									{ field.status } ·{ ' ' }
									{ Math.round( field.confidence * 100 ) }%
									confidence
								</small>
								{ field.source_snippet && (
									<small>{ field.source_snippet }</small>
								) }
							</div>
						)
					) }
					{ corrections &&
						EDITABLE_FIELDS.map( ( item ) => (
							<label
								className="sup-field"
								key={ item.key }
								htmlFor={ `sup-build-sheet-${ item.key }` }
							>
								<span className="sup-field__label">
									{ item.label }
								</span>
								<input
									id={ `sup-build-sheet-${ item.key }` }
									value={ corrections[ item.key ] }
									onChange={ ( event ) =>
										setCorrections( {
											...corrections,
											[ item.key ]:
												event.currentTarget.value,
										} )
									}
								/>
							</label>
						) ) }
					<p>
						Recognized codes:{ ' ' }
						{ result.recognized_option_codes.join( ', ' ) ||
							'none' }
					</p>
					<p>
						Unknown codes:{ ' ' }
						{ result.unknown_option_codes.join( ', ' ) || 'none' }
					</p>
					{ changingVehicle && state.placements.length > 0 && (
						<p className="sup-planning-warning">
							Applying this vehicle will clear all current
							placements.
						</p>
					) }
					{ ! matchedVehicle && (
						<p role="status">
							This result does not match a supported 144 or 170
							High Roof planner vehicle.
						</p>
					) }
					<button
						type="button"
						disabled={ ! matchedVehicle || ! changingVehicle }
						onClick={ () => {
							if ( matchedVehicle && changingVehicle ) {
								selectVehicle( matchedVehicle );
							}
						} }
					>
						{ changingVehicle
							? 'Apply vehicle to planner'
							: 'Vehicle already applied' }
					</button>
				</div>
			) }
		</section>
	);
}
