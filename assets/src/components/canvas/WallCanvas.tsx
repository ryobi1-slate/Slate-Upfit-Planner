/**
 * Interactive single-wall canvas. Owns pointer→inch conversion and drag state;
 * delegates all geometry/validation to the engine via usePlanner. Renders the
 * static chrome (WallCanvasSvg), zone overlay, placed blocks, and the ghost
 * preview.
 */

import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from '@wordpress/element';
import { usePlanner } from '../../hooks/usePlanner';
import { createWallScale } from './scale';
import { WallCanvasSvg } from './WallCanvasSvg';
import { ZoneOverlay } from './ZoneOverlay';
import { PlacementBlock } from './PlacementBlock';
import { PlacementPreview } from './PlacementPreview';
import type { Placement } from '../../types';

const PX_PER_IN = 5;

interface DragState {
	id: string;
	startPointerIn: number;
	startPosition: number;
}

export function WallCanvas() {
	const {
		state,
		activeWallGeometry,
		remainingOnActiveWall,
		selectPlacement,
		previewAt,
		clearPreview,
		placeSelected,
		moveTo,
		removePlacement,
		fitmentFor,
	} = usePlanner();
	const {
		activeWall,
		selectedSku,
		preview,
		placements,
		componentsBySku,
		selectedPlacementId,
	} = state;

	const svgRef = useRef< SVGSVGElement | null >( null );
	const [ drag, setDrag ] = useState< DragState | null >( null );

	const scale = useMemo(
		() =>
			activeWallGeometry
				? createWallScale( activeWallGeometry, PX_PER_IN )
				: null,
		[ activeWallGeometry ]
	);

	const pointerToInches = useCallback(
		( e: { clientX: number; clientY: number } ): number => {
			const svg = svgRef.current;
			if ( ! svg || ! scale ) {
				return 0;
			}
			const pt = svg.createSVGPoint();
			pt.x = e.clientX;
			pt.y = e.clientY;
			const ctm = svg.getScreenCTM();
			if ( ! ctm ) {
				return 0;
			}
			const local = pt.matrixTransform( ctm.inverse() );
			return ( local.x - scale.marginL ) / PX_PER_IN;
		},
		[ scale ]
	);

	// Drag lifecycle — window listeners while a block is being dragged.
	useEffect( () => {
		if ( ! drag ) {
			return;
		}
		const onMove = ( e: PointerEvent ) => {
			const xIn = pointerToInches( e );
			moveTo(
				drag.id,
				drag.startPosition + ( xIn - drag.startPointerIn )
			);
		};
		const onUp = () => setDrag( null );
		window.addEventListener( 'pointermove', onMove );
		window.addEventListener( 'pointerup', onUp );
		return () => {
			window.removeEventListener( 'pointermove', onMove );
			window.removeEventListener( 'pointerup', onUp );
		};
	}, [ drag, pointerToInches, moveTo ] );

	const startDrag = useCallback(
		( id: string, e: React.PointerEvent ) => {
			const p = placements.find( ( pl ) => pl.id === id );
			if ( ! p ) {
				return;
			}
			setDrag( {
				id,
				startPointerIn: pointerToInches( e ),
				startPosition: p.position.x,
			} );
		},
		[ placements, pointerToInches ]
	);

	if ( ! activeWallGeometry || ! scale ) {
		return null;
	}
	const wall = activeWallGeometry;

	// Ghost preview validity — probe a synthetic placement through the engine.
	const previewComponent =
		preview && selectedSku ? componentsBySku[ selectedSku ] : undefined;
	let previewValid = false;
	if ( preview && previewComponent && selectedSku ) {
		const probe: Placement = {
			id: '__preview',
			sku: selectedSku,
			wall: preview.wall,
			position: preview.position,
		};
		previewValid = fitmentFor( probe )?.severity !== 'error';
	}

	const laneHandlers = {
		onPointerMove: ( e: React.PointerEvent ) => {
			if ( selectedSku && ! drag ) {
				previewAt( activeWall, pointerToInches( e ) );
			}
		},
		onPointerLeave: () => clearPreview(),
		onClick: ( e: React.MouseEvent ) => {
			if ( selectedSku ) {
				placeSelected( activeWall, pointerToInches( e ) );
			} else if ( selectedPlacementId ) {
				selectPlacement( null );
			}
		},
	};

	return (
		<svg
			ref={ svgRef }
			className={
				'sup-wall-canvas' +
				( selectedSku ? ' sup-wall-canvas--armed' : '' )
			}
			width="100%"
			viewBox={ `0 0 ${ scale.svgW } ${ scale.svgH }` }
			role="group"
			aria-label={ `${ wall.label } planning canvas` }
		>
			<defs>
				<pattern
					id="supGrid"
					width={ PX_PER_IN * 6 }
					height={ PX_PER_IN * 6 }
					patternUnits="userSpaceOnUse"
				>
					<path
						d={ `M ${ PX_PER_IN * 6 } 0 L 0 0 0 ${
							PX_PER_IN * 6
						}` }
						fill="none"
						stroke="var(--slate-line)"
						strokeWidth="0.5"
						opacity="0.25"
					/>
				</pattern>
				<pattern
					id="supHatch"
					patternUnits="userSpaceOnUse"
					width="6"
					height="6"
					patternTransform="rotate(45)"
				>
					<line
						x1="0"
						y1="0"
						x2="0"
						y2="6"
						stroke="var(--slate-muted)"
						strokeWidth="1"
						opacity="0.4"
					/>
				</pattern>
				<pattern
					id="supHatchWarn"
					patternUnits="userSpaceOnUse"
					width="6"
					height="6"
					patternTransform="rotate(45)"
				>
					<line
						x1="0"
						y1="0"
						x2="0"
						y2="6"
						stroke="var(--slate-error)"
						strokeWidth="1.2"
						opacity="0.9"
					/>
				</pattern>
			</defs>

			<rect
				x="0"
				y="0"
				width={ scale.svgW }
				height={ scale.svgH }
				fill="var(--slate-canvas)"
			/>

			<WallCanvasSvg
				wall={ wall }
				scale={ scale }
				remaining={ remainingOnActiveWall }
			/>

			{ /* Transparent capture layer for hover-preview + click-to-place. */ }
			<rect
				className="sup-lane-capture"
				x={ scale.U( 0 ) }
				y={ scale.laneTop }
				width={ wall.length * PX_PER_IN }
				height={ scale.laneHeight }
				fill="transparent"
				{ ...laneHandlers }
			/>

			<ZoneOverlay wall={ wall } scale={ scale } />

			{ placements
				.filter( ( p ) => p.wall === activeWall )
				.map( ( p ) => {
					const component = componentsBySku[ p.sku ];
					if ( ! component ) {
						return null;
					}
					return (
						<PlacementBlock
							key={ p.id }
							placement={ p }
							component={ component }
							scale={ scale }
							selected={ p.id === selectedPlacementId }
							dragging={ drag?.id === p.id }
							fitment={ fitmentFor( p ) }
							onSelect={ selectPlacement }
							onStartDrag={ startDrag }
							onRemove={ removePlacement }
							onNudge={ ( id, delta ) =>
								moveTo( id, p.position.x + delta )
							}
						/>
					);
				} ) }

			{ preview && previewComponent && (
				<PlacementPreview
					component={ previewComponent }
					positionX={ preview.position.x }
					scale={ scale }
					valid={ previewValid }
				/>
			) }
		</svg>
	);
}
