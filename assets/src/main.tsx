/**
 * Browser entry point. Mounts the planner React app into the shortcode's
 * `#slate-upfit-planner-root` div. Compiled by @wordpress/scripts into
 * assets/dist/planner.js (+ planner.css, planner.asset.php).
 */

import { createRoot } from '@wordpress/element';
import { App } from './app/App';
import './styles/index.css';

const container = document.getElementById( 'slate-upfit-planner-root' );

if ( container ) {
	createRoot( container ).render( <App /> );
}
