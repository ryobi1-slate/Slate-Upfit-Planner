/** Combined horizontal technical-plan projection of the existing planner state. */
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { usePlanner } from '../../hooks/usePlanner';
import { getWall } from '../../data/geometry';
import type { Placement, PlannerComponent, WallId } from '../../types';

const PPI = 6;
const DEPTH_SCALE = 3.2;
const LEFT = 76;
const TOP = 142;

interface DragState {
	id: string;
	pointer: number;
	position: number;
}

export function FullPlanCanvas() {
	const planner = usePlanner();
	const { state, totals } = planner;
	const { moveTo } = planner;
	const {
		vehicle,
		placements,
		componentsBySku,
		selectedPlacementId,
		selectedSku,
		preview,
	} = state;
	const passenger = getWall( vehicle, 'passenger' );
	const driver = getWall( vehicle, 'driver' );
	const svgRef = useRef< SVGSVGElement | null >( null );
	const [ drag, setDrag ] = useState< DragState | null >( null );
	const width = LEFT + vehicle.length * PPI + 82;
	const bottom = TOP + vehicle.width * 4.1;
	const height = bottom + 86;
	const U = useCallback( ( inches: number ) => LEFT + inches * PPI, [] );
	const pointerInches = useCallback(
		( event: { clientX: number; clientY: number } ) => {
			const svg = svgRef.current;
			if ( ! svg ) {
				return 0;
			}
			const point = svg.createSVGPoint();
			point.x = event.clientX;
			point.y = event.clientY;
			const ctm = svg.getScreenCTM();
			return ctm
				? ( point.matrixTransform( ctm.inverse() ).x - LEFT ) / PPI
				: 0;
		},
		[]
	);

	useEffect( () => {
		if ( ! drag ) {
			return;
		}
		const move = ( event: PointerEvent ) =>
			moveTo(
				drag.id,
				drag.position + pointerInches( event ) - drag.pointer
			);
		const up = () => setDrag( null );
		window.addEventListener( 'pointermove', move );
		window.addEventListener( 'pointerup', up );
		return () => {
			window.removeEventListener( 'pointermove', move );
			window.removeEventListener( 'pointerup', up );
		};
	}, [ drag, moveTo, pointerInches ] );

	useEffect( () => {
		if ( ! selectedPlacementId ) {
			return;
		}
		const selected = svgRef.current?.querySelector< SVGGElement >(
			`[data-placement-id="${ selectedPlacementId }"]`
		);
		const stage =
			svgRef.current?.closest< HTMLElement >( '.sup-canvas__stage' );
		if (
			! selected ||
			! stage ||
			typeof stage.scrollTo !== 'function' ||
			stage.scrollWidth <= stage.clientWidth
		) {
			return;
		}
		const box = selected.getBoundingClientRect();
		const stageBox = stage.getBoundingClientRect();
		stage.scrollTo( {
			left:
				stage.scrollLeft +
				box.left -
				stageBox.left +
				box.width / 2 -
				stage.clientWidth / 2,
			behavior: 'smooth',
		} );
	}, [ selectedPlacementId ] );

	if ( ! passenger || ! driver ) {
		return null;
	}
	const wheel = passenger.wheelWells[ 0 ];
	const door = passenger.doorZones[ 0 ];
	const remaining = Object.fromEntries(
		totals.wallUsage.map( ( item ) => [ item.wall, item.availableLength ] )
	);
	const previewComponent =
		preview && selectedSku ? componentsBySku[ selectedSku ] : undefined;
	const previewFit =
		preview && previewComponent && selectedSku
			? planner.fitmentFor( {
					id: '__preview',
					sku: selectedSku,
					wall: preview.wall,
					position: preview.position,
			  } )
			: null;
	const capture = ( wall: WallId, y: number ) => ( {
		x: U( 0 ),
		y,
		width: vehicle.length * PPI,
		height: 64,
		onPointerMove: ( event: React.PointerEvent ) => {
			planner.switchWall( wall );
			if ( selectedSku ) {
				planner.previewAt( wall, pointerInches( event ) );
			}
		},
		onPointerLeave: planner.clearPreview,
		onClick: ( event: React.MouseEvent ) => {
			planner.switchWall( wall );
			if ( selectedSku ) {
				planner.placeSelected( wall, pointerInches( event ) );
			}
		},
	} );
	const rail = (
		key: string,
		label: string,
		from: number,
		to: number,
		y: number,
		accent = false
	) => {
		const mid = ( U( from ) + U( to ) ) / 2;
		return (
			<g key={ key }>
				<line
					x1={ U( from ) }
					y1={ y }
					x2={ U( to ) }
					y2={ y }
					className="sup-plan-dimension"
				/>
				<line
					x1={ U( from ) }
					y1={ y - 5 }
					x2={ U( from ) }
					y2={ y + 5 }
					className="sup-plan-dimension"
				/>
				<line
					x1={ U( to ) }
					y1={ y - 5 }
					x2={ U( to ) }
					y2={ y + 5 }
					className="sup-plan-dimension"
				/>
				<circle
					cx={ mid }
					cy={ y }
					r="12"
					className={
						accent
							? 'sup-plan-zone-key accent'
							: 'sup-plan-zone-key'
					}
				/>
				<text
					x={ mid }
					y={ y + 4 }
					textAnchor="middle"
					className="sup-plan-zone-letter"
				>
					{ key }
				</text>
				<text
					x={ mid + 18 }
					y={ y - 8 }
					textAnchor="middle"
					className="sup-plan-rail-label"
				>
					{ label }
				</text>
			</g>
		);
	};

	return (
		<svg
			ref={ svgRef }
			className={ `sup-full-plan${
				selectedSku ? ' sup-full-plan--armed' : ''
			}` }
			viewBox={ `0 0 ${ width } ${ height }` }
			role="group"
			aria-label="Full vehicle technical plan"
		>
			<defs>
				<pattern
					id="supPlanGrid"
					width="30"
					height="30"
					patternUnits="userSpaceOnUse"
				>
					<path
						d="M30 0H0V30"
						fill="none"
						stroke="var(--slate-line)"
						strokeWidth=".5"
						opacity=".2"
					/>
				</pattern>
				<pattern
					id="supPlanHatch"
					width="7"
					height="7"
					patternUnits="userSpaceOnUse"
					patternTransform="rotate(45)"
				>
					<line y2="7" stroke="var(--slate-muted)" opacity=".42" />
				</pattern>
			</defs>
			<rect
				width={ width }
				height={ height }
				className="sup-plan-paper"
			/>
			{ rail(
				'H',
				`Partition zone ${ passenger.partition }\"`,
				0,
				passenger.partition,
				54
			) }
			{ rail(
				'I',
				`Available cargo ${ vehicle.length - passenger.partition }\"`,
				passenger.partition,
				vehicle.length,
				85
			) }
			{ door &&
				rail(
					'G',
					`Door opening ${ door.to - door.from }\"`,
					door.from,
					door.to,
					54,
					true
				) }
			{ wheel &&
				rail(
					'E',
					`Wheel well ${ wheel.to - wheel.from }\"`,
					wheel.from,
					wheel.to,
					54,
					true
				) }
			<rect
				x={ U( 0 ) }
				y={ TOP }
				width={ vehicle.length * PPI }
				height={ bottom - TOP }
				fill="url(#supPlanGrid)"
				className="sup-plan-shell"
			/>
			<path
				d={ `M${ U( 0 ) + 28 },${ TOP } Q${ U( 0 ) },${ TOP } ${ U(
					0
				) },${ TOP + 42 }V${ bottom - 42 }Q${ U( 0 ) },${ bottom } ${
					U( 0 ) + 28
				},${ bottom }` }
				className="sup-plan-nose"
			/>
			<line
				x1={ U( vehicle.length ) }
				y1={ TOP }
				x2={ U( vehicle.length ) }
				y2={ bottom }
				className="sup-plan-rear"
			/>
			<g className="sup-zones" aria-hidden="true" pointerEvents="none">
				<rect
					x={ U( 0 ) }
					y={ TOP }
					width={ passenger.partition * PPI }
					height={ bottom - TOP }
					fill="url(#supPlanHatch)"
					className="sup-plan-partition"
				/>
				<text
					x={ U( passenger.partition / 2 ) }
					y={ ( TOP + bottom ) / 2 }
					textAnchor="middle"
					className="sup-plan-zone-label"
					transform={ `rotate(-90 ${ U( passenger.partition / 2 ) } ${
						( TOP + bottom ) / 2
					})` }
				>
					FACTORY PARTITION
				</text>
				{ door && (
					<>
						<rect
							x={ U( door.from ) }
							y={ TOP }
							width={ ( door.to - door.from ) * PPI }
							height="18"
							className="sup-plan-door"
						/>
						<text
							x={ ( U( door.from ) + U( door.to ) ) / 2 }
							y={ TOP + 13 }
							textAnchor="middle"
							className="sup-plan-zone-label"
						>
							SLIDING DOOR
						</text>
					</>
				) }
				{ wheel && (
					<>
						<rect
							x={ U( wheel.from ) }
							y={ TOP }
							width={ ( wheel.to - wheel.from ) * PPI }
							height={ wheel.depth * DEPTH_SCALE }
							className="sup-plan-wheel"
						/>
						<rect
							x={ U( wheel.from ) }
							y={ bottom - wheel.depth * DEPTH_SCALE }
							width={ ( wheel.to - wheel.from ) * PPI }
							height={ wheel.depth * DEPTH_SCALE }
							className="sup-plan-wheel"
						/>
						<text
							x={ ( U( wheel.from ) + U( wheel.to ) ) / 2 }
							y={ TOP + 11 }
							textAnchor="middle"
							className="sup-plan-zone-label"
						>
							WHEEL WELL
						</text>
						<text
							x={ ( U( wheel.from ) + U( wheel.to ) ) / 2 }
							y={ bottom - 4 }
							textAnchor="middle"
							className="sup-plan-zone-label"
						>
							WHEEL WELL
						</text>
					</>
				) }
			</g>
			<text
				x={ ( U( 0 ) + U( vehicle.length ) ) / 2 }
				y={ TOP - 17 }
				textAnchor="middle"
				className="sup-plan-side-label"
			>
				PASSENGER SIDE
			</text>
			<text
				x={ ( U( 0 ) + U( vehicle.length ) ) / 2 }
				y={ bottom + 25 }
				textAnchor="middle"
				className="sup-plan-side-label"
			>
				DRIVER SIDE
			</text>
			<text
				x={ U( 0 ) - 30 }
				y={ ( TOP + bottom ) / 2 }
				textAnchor="middle"
				className="sup-plan-side-label"
				transform={ `rotate(-90 ${ U( 0 ) - 30 } ${
					( TOP + bottom ) / 2
				})` }
			>
				FRONT
			</text>
			<text
				x={ U( vehicle.length ) + 35 }
				y={ ( TOP + bottom ) / 2 }
				textAnchor="middle"
				className="sup-plan-side-label"
				transform={ `rotate(90 ${ U( vehicle.length ) + 35 } ${
					( TOP + bottom ) / 2
				})` }
			>
				REAR · SWING, 270°
			</text>
			<rect
				className={ `sup-plan-wall-capture${
					state.activeWall === 'passenger' ? ' is-active' : ''
				}` }
				{ ...capture( 'passenger', TOP ) }
			/>
			<rect
				className={ `sup-plan-wall-capture${
					state.activeWall === 'driver' ? ' is-active' : ''
				}` }
				{ ...capture( 'driver', bottom - 64 ) }
			/>
			{ placements.map( ( placement ) => {
				const component = componentsBySku[ placement.sku ];
				return component ? (
					<PlanPlacement
						key={ placement.id }
						placement={ placement }
						component={ component }
						bottom={ bottom }
						selected={ placement.id === selectedPlacementId }
						fit={
							planner.fitmentFor( placement )?.severity ?? 'ok'
						}
						U={ U }
						onSelect={ planner.selectPlacement }
						onDrag={ ( id, event ) =>
							setDrag( {
								id,
								pointer: pointerInches( event ),
								position: placement.position.x,
							} )
						}
						onMove={ planner.moveTo }
						onRemove={ planner.removePlacement }
					/>
				) : null;
			} ) }
			{ preview && previewComponent && (
				<Preview
					placement={ preview }
					component={ previewComponent }
					bottom={ bottom }
					U={ U }
					valid={ previewFit?.severity !== 'error' }
				/>
			) }
			{ ( [ 'passenger', 'driver' ] as WallId[] ).map( ( wall ) => (
				<g
					key={ wall }
					transform={ `translate(${ U( vehicle.length ) - 154 },${
						wall === 'passenger' ? TOP + 72 : bottom - 94
					})` }
				>
					<rect width="144" height="24" className="sup-plan-remain" />
					<text
						x="72"
						y="16"
						textAnchor="middle"
						className="sup-plan-remain-label"
					>
						{ wall.toUpperCase() } REMAIN{ ' ' }
						{ Math.round( remaining[ wall ] ?? 0 ) }&quot;
					</text>
				</g>
			) ) }
			<line
				x1={ U( 0 ) }
				y1={ bottom + 48 }
				x2={ U( vehicle.length ) }
				y2={ bottom + 48 }
				className="sup-plan-dimension"
			/>
			<text
				x={ ( U( 0 ) + U( vehicle.length ) ) / 2 }
				y={ bottom + 67 }
				textAnchor="middle"
				className="sup-plan-rail-label"
			>
				{ vehicle.length }&quot; CARGO LENGTH
			</text>
		</svg>
	);
}

function PlanPlacement( {
	placement,
	component,
	bottom,
	selected,
	fit,
	U,
	onSelect,
	onDrag,
	onMove,
	onRemove,
}: {
	placement: Placement;
	component: PlannerComponent;
	bottom: number;
	selected: boolean;
	fit: string;
	U: ( n: number ) => number;
	onSelect: ( id: string ) => void;
	onDrag: ( id: string, e: React.PointerEvent ) => void;
	onMove: ( id: string, x: number ) => void;
	onRemove: ( id: string ) => void;
} ) {
	const x = U( placement.position.x );
	const w = component.length * PPI;
	const h = Math.max( 48, component.depth * DEPTH_SCALE );
	const y = placement.wall === 'passenger' ? TOP : bottom - h;
	return (
		<g
			data-placement-id={ placement.id }
			className={ `sup-plan-placement${
				selected ? ' sup-plan-placement--selected' : ''
			}${ fit !== 'ok' ? ` sup-plan-placement--${ fit }` : '' }` }
			role="button"
			tabIndex={ 0 }
			aria-pressed={ selected }
			aria-label={ `${ component.name }, ${ placement.position.x } inches from front on ${ placement.wall } wall` }
			onPointerDown={ ( e ) => {
				e.preventDefault();
				onSelect( placement.id );
				onDrag( placement.id, e );
			} }
			onKeyDown={ ( e ) => {
				if ( e.key === 'ArrowLeft' || e.key === 'ArrowRight' ) {
					e.preventDefault();
					onMove(
						placement.id,
						placement.position.x +
							( e.key === 'ArrowLeft' ? -1 : 1 )
					);
				}
				if ( e.key === 'Delete' || e.key === 'Backspace' ) {
					e.preventDefault();
					onRemove( placement.id );
				}
			} }
		>
			<rect
				x={ x }
				y={ y }
				width={ w }
				height={ h }
				className="sup-plan-placement__body"
			/>
			{ Array.from( { length: Math.max( 0, component.tiers - 1 ) } ).map(
				( _, i ) => (
					<line
						key={ i }
						x1={ x + ( w * ( i + 1 ) ) / component.tiers }
						y1={ y }
						x2={ x + ( w * ( i + 1 ) ) / component.tiers }
						y2={ y + h }
						className="sup-plan-placement__tier"
					/>
				)
			) }
			<text
				x={ x + w / 2 }
				y={ y + h / 2 - 3 }
				textAnchor="middle"
				className="sup-plan-placement__sku"
			>
				{ component.sku }
			</text>
			<text
				x={ x + w / 2 }
				y={ y + h / 2 + 13 }
				textAnchor="middle"
				className="sup-plan-placement__dim"
			>
				{ component.length }&quot;
			</text>
			{ selected &&
				[
					[ x, y ],
					[ x + w, y ],
					[ x, y + h ],
					[ x + w, y + h ],
				].map( ( point, i ) => (
					<rect
						key={ i }
						x={ point[ 0 ] - 4 }
						y={ point[ 1 ] - 4 }
						width="8"
						height="8"
						className="sup-handle"
					/>
				) ) }
		</g>
	);
}

function Preview( {
	placement,
	component,
	bottom,
	U,
	valid,
}: {
	placement: { wall: WallId; position: { x: number; y: number } };
	component: PlannerComponent;
	bottom: number;
	U: ( n: number ) => number;
	valid: boolean;
} ) {
	const h = Math.max( 48, component.depth * DEPTH_SCALE );
	return (
		<g
			className={ `sup-plan-preview${ valid ? '' : ' is-invalid' }` }
			pointerEvents="none"
		>
			<rect
				x={ U( placement.position.x ) }
				y={ placement.wall === 'passenger' ? TOP : bottom - h }
				width={ component.length * PPI }
				height={ h }
			/>
			<text
				x={ U( placement.position.x ) + ( component.length * PPI ) / 2 }
				y={ placement.wall === 'passenger' ? TOP + 25 : bottom - 25 }
				textAnchor="middle"
			>
				{ valid ? '+ PLACE' : 'BLOCKED' }
			</text>
		</g>
	);
}
