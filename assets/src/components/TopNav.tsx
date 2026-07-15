/**
 * Top navigation bar of the product shell.
 */

import type { BootstrapContext } from '../services/bootstrap';

const TABS = [ 'Planner', 'Packages', 'Build Sheet', 'Saved' ] as const;

export function TopNav( { mode }: { mode: BootstrapContext[ 'mode' ] } ) {
	return (
		<nav className="sup-nav">
			<div className="sup-nav__brand">
				<span className="sup-nav__eyebrow">Slate</span>
				<strong>Upfit Planner</strong>
			</div>

			<div className="sup-nav__tabs" role="tablist">
				{ TABS.map( ( tab, index ) => (
					<button
						key={ tab }
						type="button"
						role="tab"
						aria-selected={ index === 0 }
						className={
							'sup-nav__tab' +
							( index === 0 ? ' sup-nav__tab--active' : '' )
						}
					>
						{ tab }
					</button>
				) ) }
			</div>

			<span
				className={
					'sup-nav__mode' +
					( mode === 'hosted' ? ' sup-nav__mode--hosted' : '' )
				}
			>
				{ mode === 'hosted' ? 'Dealer Portal' : 'Standalone Demo' }
			</span>
		</nav>
	);
}
