/**
 * Legend for the wall canvas — explains the marks and states.
 */

const ITEMS: Array< { swatch: string; label: string } > = [
	{ swatch: 'shell', label: 'Wall lane' },
	{ swatch: 'hatch', label: 'No-mount zone' },
	{ swatch: 'door', label: 'Door opening' },
	{ swatch: 'wheel', label: 'Wheel well' },
	{ swatch: 'shelf', label: 'Placed shelf' },
	{ swatch: 'warn', label: 'Fit conflict' },
];

export function CanvasLegend() {
	return (
		<div className="sup-legend">
			{ ITEMS.map( ( it ) => (
				<span key={ it.swatch } className="sup-legend-item">
					<span
						className={ `sup-legend-sw sup-legend-sw--${ it.swatch }` }
					/>
					{ it.label }
				</span>
			) ) }
			<span className="sup-legend-tip">
				Select a shelf, hover the lane to preview, click to place. Drag
				a shelf (1&quot; snap) or use ← → when selected; Delete removes.
			</span>
		</div>
	);
}
