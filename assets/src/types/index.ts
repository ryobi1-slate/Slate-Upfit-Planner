/**
 * Core domain types for the Slate Upfit Planner.
 *
 * These are framework-agnostic — they must not import React. The fitment engine
 * (`engine/`) and the state layer (`state/`) both build on these shapes, and the
 * normalized `ConfigurationPayload` is the contract exchanged with WordPress
 * REST and the PHP host adapter.
 */

/** Millimeters. All planner geometry is metric internally. */
export type Millimeters = number;

/** Kilograms. */
export type Kilograms = number;

/** Which interior wall/zone a component is mounted to. */
export type WallId = 'driver' | 'passenger' | 'rear' | 'floor' | 'ceiling';

/** Severity of a fitment issue surfaced by the engine. */
export type FitmentSeverity = 'error' | 'warning' | 'info';

/**
 * A 2D bounding region on a wall, measured from the wall's forward/lower origin.
 */
export interface Rect {
	x: Millimeters;
	y: Millimeters;
	width: Millimeters;
	height: Millimeters;
}

/**
 * Geometry envelope for a vehicle wall/zone. The engine uses this to decide
 * whether a component fits and where open space remains.
 */
export interface WallGeometry {
	id: WallId;
	label: string;
	/** Usable interior length of the wall. */
	length: Millimeters;
	/** Usable interior height of the wall. */
	height: Millimeters;
	/** Optional obstructions (wheel wells, doors) as keep-out rects. */
	keepOut?: Rect[];
}

/**
 * Physical envelope + capacity for a selected vehicle.
 */
export interface VehicleGeometry {
	id: string;
	name: string;
	wheelbase: string;
	/** Max payload the chassis can carry. */
	payloadCapacity: Kilograms;
	/** Curb weight, used to derive remaining payload. */
	curbWeight: Kilograms;
	walls: WallGeometry[];
}

/** Catalog category for a planner component. */
export type ComponentCategory =
	| 'shelf'
	| 'drawer'
	| 'partition'
	| 'electrical'
	| 'exterior'
	| 'accessory';

/**
 * A catalog item that can be placed in the build. This is the planner's own
 * representation — pricing/entitlement come from the host, not from here.
 */
export interface PlannerComponent {
	sku: string;
	name: string;
	category: ComponentCategory;
	/** Footprint on a wall. */
	width: Millimeters;
	height: Millimeters;
	depth: Millimeters;
	weight: Kilograms;
	/** Walls this component is allowed to mount to. */
	compatibleWalls: WallId[];
	/** Placeholder catalog value for the package roll-up (host owns real price). */
	listValue: number;
}

/**
 * A component placed on a wall at a position. `id` is the placement instance id
 * (distinct from the component SKU, which may appear multiple times).
 */
export interface Placement {
	id: string;
	sku: string;
	wall: WallId;
	position: { x: Millimeters; y: Millimeters };
}

/**
 * An issue produced by fitment validation.
 */
export interface FitmentIssue {
	code: string;
	severity: FitmentSeverity;
	message: string;
	/** Placement this issue relates to, if any. */
	placementId?: string;
}

/** Usage roll-up for a single wall. */
export interface WallUsage {
	wall: WallId;
	usedLength: Millimeters;
	availableLength: Millimeters;
	utilization: number; // 0..1
}

/** Payload roll-up for the whole build. */
export interface PayloadSummary {
	componentWeight: Kilograms;
	curbWeight: Kilograms;
	capacity: Kilograms;
	remaining: Kilograms;
	overCapacity: boolean;
}

/** Aggregate totals surfaced on the build sheet. */
export interface Totals {
	wallUsage: WallUsage[];
	payload: PayloadSummary;
	packageValue: number;
}

/**
 * Versioned normalized payload — the single contract for save + quote handoff.
 * Field names are snake_case to match the JSON schema and the PHP boundary.
 */
export interface ConfigurationPayload {
	schema_version: '1.0';
	configuration_id: string | null;
	vehicle: {
		id: string;
		name: string;
		wheelbase: string;
		wall: WallId | null;
	};
	placements: Array< {
		id: string;
		sku: string;
		wall: WallId;
		position: { x: Millimeters; y: Millimeters };
	} >;
	infrastructure: unknown[];
	exterior_equipment: unknown[];
	validation: Array< {
		code: string;
		severity: FitmentSeverity;
		message: string;
		placement_id?: string;
	} >;
	totals: {
		wall_usage: Record< string, unknown >;
		payload: Record< string, unknown >;
		package_value: number | null;
	};
	dealer_notes: string;
}

export const SCHEMA_VERSION = '1.0' as const;
