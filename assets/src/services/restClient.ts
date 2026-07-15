/**
 * Browser <-> WordPress REST client. This is the ONLY channel the browser uses
 * to reach the server. The server, in turn, reaches the host (Dealer Portal)
 * through the PHP host adapter — the browser never talks to the host plugin or
 * Business Central directly.
 *
 * Phase 1 provides typed wrappers around the REST endpoints registered by
 * `RestController`. Wiring these into UI actions (save/quote buttons) is a later
 * phase; the shell renders with placeholder data today.
 */

import type { BootstrapContext } from './bootstrap';
import type { ConfigurationPayload } from '../types';

export interface RestResult< T = unknown > {
	ok: boolean;
	status: number;
	data: T | null;
	errors: string[];
}

export class RestClient {
	private readonly ctx: BootstrapContext;

	constructor( ctx: BootstrapContext ) {
		this.ctx = ctx;
	}

	private async request< T >(
		path: string,
		init: RequestInit
	): Promise< RestResult< T > > {
		if ( ! this.ctx.restUrl ) {
			return {
				ok: false,
				status: 0,
				data: null,
				errors: [ 'REST is unavailable in standalone mode.' ],
			};
		}

		const response = await fetch( `${ this.ctx.restUrl }${ path }`, {
			...init,
			headers: {
				'Content-Type': 'application/json',
				'X-WP-Nonce': this.ctx.restNonce,
				...( init.headers ?? {} ),
			},
		} );

		let data: T | null = null;
		try {
			data = ( await response.json() ) as T;
		} catch {
			data = null;
		}

		// Prefer our custom `errors` array, but fall back to the standard
		// WordPress REST error shape ({ code, message, data }) so 4xx/5xx
		// messages aren't silently dropped.
		let errors: string[] = [];
		if ( data && typeof data === 'object' ) {
			const body = data as {
				errors?: unknown;
				message?: unknown;
			};
			if ( Array.isArray( body.errors ) ) {
				errors = body.errors.map( ( e ) => String( e ) );
			} else if ( typeof body.message === 'string' ) {
				errors = [ body.message ];
			}
		}

		return { ok: response.ok, status: response.status, data, errors };
	}

	getContext() {
		return this.request( '/context', { method: 'GET' } );
	}

	saveConfiguration( payload: ConfigurationPayload ) {
		return this.request( '/configurations', {
			method: 'POST',
			body: JSON.stringify( payload ),
		} );
	}

	addToQuote( payload: ConfigurationPayload ) {
		return this.request( '/quote', {
			method: 'POST',
			body: JSON.stringify( payload ),
		} );
	}
}
