/**
 * A single placed component on the wall lane. Handles selection, drag start,
 * keyboard interaction, and valid/warning/conflict styling. Presentational +
 * event forwarding only — geometry/validation live in the engine/hook.
 */

import type { FitmentResult, Placement, PlannerComponent } from '../../types';
import type { CanvasScale } from './scale';

export function PlacementBlock( {
	placement,
	component,
	scale,
	selected,
	dragging,
	fitment,
	onSelect,
	onStartDrag,
	onRemove,
	onNudge,
}: {
	placement: Placement;
	component: PlannerComponent;
	scale: CanvasScale;
	selected: boolean;
	dragging: boolean;
	fitment: FitmentResult | null;
	onSelect: ( id: string ) => void;
	onStartDrag: ( id: string, e: React.PointerEvent ) => void;
	onRemove: ( id: string ) => void;
	onNudge: ( id: string, deltaIn: number ) => void;
} ) {
	const { U, laneTop, pxPerIn } = scale;
	const x = U( placement.position.x );
	const y = laneTop;
	const w = component.length * pxPerIn;
	const h = component.depth * pxPerIn;

	const severity = fitment?.severity ?? 'ok';
	const bad = severity === 'error';
	const warn = severity === 'warning';

	let stateClass = '';
	if ( bad ) {
		stateClass = ' sup-placement--error';
	} else if ( warn ) {
		stateClass = ' sup-placement--warning';
	} else if ( selected ) {
		stateClass = ' sup-placement--selected';
	}

	let stateNote = '';
	if ( bad ) {
		stateNote = ', has a fit conflict';
	} else if ( warn ) {
		stateNote = ', has a fit warning';
	}
	const label = `${ component.name }, ${ placement.position.x } inches from front on ${ placement.wall } wall${ stateNote }`;

	return (
		<g
			className={ `sup-placement${ stateClass }` }
			tabIndex={ 0 }
			role="button"
			aria-label={ label }
			aria-pressed={ selected }
			style={ { cursor: dragging ? 'grabbing' : 'grab' } }
			onPointerDown={ ( e ) => {
				e.preventDefault();
				onSelect( placement.id );
				onStartDrag( placement.id, e );
			} }
			onKeyDown={ ( e ) => {
				switch ( e.key ) {
					case 'Enter':
					case ' ':
						e.preventDefault();
						onSelect( placement.id );
						break;
					case 'Delete':
					case 'Backspace':
						e.preventDefault();
						onRemove( placement.id );
						break;
					case 'ArrowLeft':
						e.preventDefault();
						onNudge( placement.id, -1 );
						break;
					case 'ArrowRight':
						e.preventDefault();
						onNudge( placement.id, 1 );
						break;
					default:
						break;
				}
			} }
		>
			{ /* Conflict overlap stripes */ }
			{ ( bad || warn ) &&
				( fitment?.issues ?? [] ).map( ( issue, i ) => {
					if ( ! issue.range ) {
						return null;
					}
					const [ a, b ] = issue.range;
					const sx = U( Math.max( a, placement.position.x ) );
					const ex = U(
						Math.min( b, placement.position.x + component.length )
					);
					return (
						<rect
							key={ `stripe-${ i }` }
							x={ sx }
							y={ y + 1 }
							width={ Math.max( 2, ex - sx ) }
							height={ h - 2 }
							fill="url(#supHatchWarn)"
							opacity="0.6"
						/>
					);
				} ) }

			<rect
				className="sup-placement-body"
				x={ x }
				y={ y }
				width={ w }
				height={ h }
			/>

			{ /* Tier lines */ }
			{ component.tiers > 1 &&
				Array.from( { length: component.tiers - 1 } ).map(
					( _, ti ) => {
						const lx = x + ( ( ti + 1 ) / component.tiers ) * w;
						return (
							<line
								key={ ti }
								x1={ lx }
								y1={ y + 2 }
								x2={ lx }
								y2={ y + h - 2 }
								className="sup-placement-tier"
							/>
						);
					}
				) }

			<text
				x={ x + w / 2 }
				y={ y + h / 2 - 3 }
				textAnchor="middle"
				className="sup-placement-sku"
			>
				{ component.sku }
			</text>
			<text
				x={ x + w / 2 }
				y={ y + h / 2 + 11 }
				textAnchor="middle"
				className="sup-placement-dim"
			>
				{ component.length }&quot;
			</text>

			{ /* Selection handles */ }
			{ selected && (
				<>
					<rect
						className="sup-handle"
						x={ x - 3 }
						y={ y - 3 }
						width="6"
						height="6"
					/>
					<rect
						className="sup-handle"
						x={ x + w - 3 }
						y={ y - 3 }
						width="6"
						height="6"
					/>
					<rect
						className="sup-handle"
						x={ x - 3 }
						y={ y + h - 3 }
						width="6"
						height="6"
					/>
					<rect
						className="sup-handle"
						x={ x + w - 3 }
						y={ y + h - 3 }
						width="6"
						height="6"
					/>
				</>
			) }

			{ dragging && (
				<text
					x={ x + w / 2 }
					y={ y - 8 }
					textAnchor="middle"
					className="sup-placement-drag"
				>
					{ placement.position.x }&quot; FROM FRONT
				</text>
			) }
		</g>
	);
}
