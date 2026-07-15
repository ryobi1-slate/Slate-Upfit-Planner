/**
 * Extends the default @wordpress/scripts webpack config so the compiled output
 * is WordPress-compatible (externalized wp-element, generated *.asset.php with
 * dependency + version info) while using a single `planner` entry built from
 * the TypeScript app.
 */
const path = require( 'path' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );

module.exports = {
	...defaultConfig,
	entry: {
		planner: path.resolve( process.cwd(), 'assets/src', 'main.tsx' ),
	},
	output: {
		...defaultConfig.output,
		path: path.resolve( process.cwd(), 'assets/dist' ),
	},
};
