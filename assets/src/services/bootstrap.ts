/**
 * Reads the bootstrap context localized by WordPress (`window.SlateUpfitPlanner`,
 * set in Plugin::renderPlanner). Provides a typed accessor with a safe
 * standalone fallback so the app runs even when opened outside WordPress.
 */

import type { WallId } from '../types';

export interface BootstrapContext {
	mode: 'hosted' | 'standalone';
	schemaVersion: string;
	restUrl: string;
	restNonce: string;
	user: Record< string, unknown >;
	dealer: Record< string, unknown >;
	catalog: Record< string, unknown >;
	pricing: Record< string, unknown >;
}

declare global {
	interface Window {
		SlateUpfitPlanner?: Partial< BootstrapContext >;
	}
}

const STANDALONE_FALLBACK: BootstrapContext = {
	mode: 'standalone',
	schemaVersion: '1.0',
	restUrl: '',
	restNonce: '',
	user: {},
	dealer: { name: 'Standalone Demo' },
	catalog: {},
	pricing: { pricing_visible: false },
};

export function getBootstrapContext(): BootstrapContext {
	const raw =
		typeof window !== 'undefined' ? window.SlateUpfitPlanner : undefined;

	if ( ! raw ) {
		return STANDALONE_FALLBACK;
	}

	return { ...STANDALONE_FALLBACK, ...raw };
}

/** The default wall the shell focuses on first. */
export const DEFAULT_WALL: WallId = 'driver';
