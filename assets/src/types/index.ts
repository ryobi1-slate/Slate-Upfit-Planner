/**
 * Core domain types for the Slate Upfit Planner.
 *
 * Framework-agnostic — no React imports. The fitment engine (`engine/`) and the
 * state layer (`state/`) build on these shapes, and the normalized
 * `ConfigurationPayload` is the contract exchanged with WordPress REST and the
 * PHP host adapter.
 *
 * Canonical engineering unit is the INCH (matching the Westcan vehicle guide).
 * Rendering converts inches to pixels; pixel coordinates are never stored in the
 * normalized payload.
 */

/** Inches — the canonical engineering unit for all geometry. */
export type Inches = number;

/** Pounds — weight unit (matches Westcan/Slate chassis payload tables). */
export type Pounds = number;

/**
 * Interior wall a component mounts to. Phase 2 covers the driver and passenger
 * walls only; roof/floor/rear are separate views handled in a later phase.
 */
export type WallId = 'driver' | 'passenger';

/** Roof variant — gates component compatibility. */
export type RoofType = 'standard' | 'high' | 'super-high' | 'metris';

/** Severity of a fitment issue. */
export type FitmentSeverity = 'error' | 'warning' | 'info';

/** Stable codes for fitment issues (telemetry + a11y labels). */
export type FitmentCode =
	| 'STARTS_IN_PARTITION'
	| 'EXCEEDS_CARGO'
	| 'BLOCKED_ZONE'
	| 'DOOR_CONFLICT'
	| 'WHEEL_WELL_START'
	| 'WHEEL_WELL_END'
	| 'SHELF_COLLISION'
	| 'INCOMPATIBLE_WALL'
	| 'INCOMPATIBLE_VEHICLE';

/* ─────────────────────────── Geometry ─────────────────────────── */

/** A hard keep-out region along a wall (partition reserve, no-mount). */
export interface BlockedZone {
	kind: 'partition' | 'no-mount';
	/** Inches from the front of the cargo area. */
	from: Inches;
	to: Inches;
	reason: string;
	/**
	 * For contoured/tapered no-mount wedges: the stay-clear depth in inches.
	 * Advisory for rendering; the along-wall [from,to] span is what blocks.
	 */
	inset?: Inches;
}

/** The sliding-door opening on a wall (hard keep-out). */
export interface DoorZone {
	from: Inches;
	to: Inches;
	reason: string;
}

/**
 * A wheel-well obstruction. SOFT: a shelf may span a wheel well; only its
 * endpoints may not land inside one (mirrors how dealers mount over arches).
 */
export interface WheelWellZone {
	from: Inches;
	to: Inches;
	/** Intrusion depth into the cabin, inches. */
	depth: Inches;
	reason: string;
}

/** A valid, mountable open run along a wall (inches from front). */
export interface MountZone {
	from: Inches;
	to: Inches;
}

/** Geometry for a single interior wall. */
export interface WallGeometry {
	wall: WallId;
	label: string;
	/** Usable cargo length front→rear, inches. */
	length: Inches;
	/** Front reserve depth (no-mount 0..partition), inches. */
	partition: Inches;
	blockedZones: BlockedZone[];
	doorZones: DoorZone[];
	wheelWells: WheelWellZone[];
}

/** Physical envelope + capacity for a selected vehicle. */
export interface VehicleGeometry {
	id: string;
	name: string;
	roof: RoofType;
	wheelbase: string;
	/** Cargo length front→rear, inches. */
	length: Inches;
	/** Interior width side-to-side, inches. */
	width: Inches;
	/** Chassis payload capacity, pounds (remaining capacity over curb weight). */
	payloadCapacity: Pounds;
	walls: WallGeometry[];
}

/* ─────────────────────────── Catalog ──────────────────────────── */

export type ComponentCategory = 'shelf' | 'drawer' | 'workbench' | 'storage';

/**
 * A catalog item that can be placed on a wall. The planner owns this
 * representation; pricing/entitlement come from the host, not from here.
 */
export interface PlannerComponent {
	sku: string;
	name: string;
	category: ComponentCategory;
	/** Along-wall footprint (front→rear), inches — the collision-driving dim. */
	length: Inches;
	/** Depth into the cabin from the wall, inches. */
	depth: Inches;
	/** Height, inches. */
	height: Inches;
	/** Weight, pounds. */
	weight: Pounds;
	/** Shelf tier count (drawing only). */
	tiers: number;
	/** Walls this component may mount to. */
	compatibleWalls: WallId[];
	/** Roof variants this component fits. Empty === any. */
	compatibleRoof: RoofType[];
}

/* ─────────────────────────── Placement ────────────────────────── */

/**
 * A component placed on a wall. `id` is the placement instance id (distinct
 * from the SKU, which may repeat). `position.x` is inches-from-front along the
 * wall; `position.y` is the height offset from the floor (0 for floor-standing
 * shelves in Phase 2, reserved for future vertical placement).
 */
export interface Placement {
	id: string;
	sku: string;
	wall: WallId;
	position: { x: Inches; y: Inches };
}

/** Resolved along-wall span for a placement. */
export interface PlacementBounds {
	wall: WallId;
	/** Inches from front (leading edge). */
	start: Inches;
	/** Inches from front (trailing edge). */
	end: Inches;
}

/* ─────────────────────────── Fitment ──────────────────────────── */

/** A single issue produced by fitment validation. */
export interface FitmentIssue {
	code: FitmentCode;
	severity: FitmentSeverity;
	message: string;
	/** Placement this issue relates to, if any. */
	placementId?: string;
	/** Along-wall overlap span [from,to] in inches, when applicable. */
	range?: [ Inches, Inches ];
}

/** Outcome of validating one placement (or a whole configuration). */
export interface FitmentResult {
	ok: boolean;
	severity: 'ok' | 'warning' | 'error';
	issues: FitmentIssue[];
}

/* ─────────────────────────── Totals ───────────────────────────── */

/** Usage roll-up for a single wall. */
export interface WallUsage {
	wall: WallId;
	/** Sum of placed component lengths, inches. */
	usedLength: Inches;
	/** Mountable length remaining (usable minus used), inches. */
	availableLength: Inches;
	/** 0..1 of the usable (post-partition) wall length. */
	utilization: number;
}

/** Payload roll-up for the whole build. */
export interface PayloadSummary {
	componentWeight: Pounds;
	capacity: Pounds;
	remaining: Pounds;
	overCapacity: boolean;
	driverWeight: Pounds;
	passengerWeight: Pounds;
}

/** Aggregate totals surfaced on the build sheet. */
export interface Totals {
	wallUsage: WallUsage[];
	payload: PayloadSummary;
	/** Placeholder — pricing is host-owned; null in standalone Phase 2. */
	packageValue: number | null;
}

/* ─────────────────────── Normalized payload ────────────────────── */

/**
 * Versioned normalized payload — the single contract for save + quote handoff.
 * Field names are snake_case to match the JSON schema and the PHP boundary.
 * Coordinates are engineering inches, never pixels.
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
		position: { x: Inches; y: Inches };
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

/** Canonical snap increment (inches). */
export const SNAP_INCREMENT: Inches = 1;
