import type { EngineeringMeasurement } from './approval';
import type { EngineeringRecord } from './provenance';

export type PlacementSurface = 'driver_wall' | 'passenger_wall';

export interface VehicleIdentity {
	vehicle_id: string;
	manufacturer: string;
	model: string;
	model_year_range: {
		from: number | null;
		to: number | null;
		status: 'verified' | 'unverified' | 'pending';
	};
	wheelbase: EngineeringMeasurement< 'in' >;
	body_length: string;
	roof_height: 'standard' | 'high' | 'super_high' | 'pending';
	drivetrain: string | null;
	chassis_variant: string | null;
	payload_capacity: EngineeringMeasurement< 'lb' >;
	geometry_id: string;
	geometry_revision: string | null;
	supported_placement_surfaces: PlacementSurface[];
	lifecycle_status: 'draft' | 'active' | 'deprecated';
}

export type VehicleRecord = EngineeringRecord< VehicleIdentity >;
