import type { EngineeringMeasurement } from './approval';
import type { EngineeringRecord } from './provenance';
import type { PlacementSurface } from './vehicle';

export interface GeometryZone {
	zone_id: string;
	zone_type: 'partition' | 'wheel_well' | 'door_opening' | 'no_mount';
	behavior: 'no_mount' | 'conditional_mount' | 'advisory';
	from: EngineeringMeasurement< 'in' >;
	to: EngineeringMeasurement< 'in' >;
	height: EngineeringMeasurement< 'in' >;
	depth: EngineeringMeasurement< 'in' >;
	status: 'verified' | 'unverified' | 'pending';
	reason: string;
}

export interface GeometryData {
	geometry_id: string;
	vehicle_id: string;
	geometry_revision: string;
	coordinate_system: {
		unit: 'in';
		origin: 'cargo_front';
		x_axis: 'toward_rear';
		y_axis: 'from_floor';
	};
	rear_boundary: EngineeringMeasurement< 'in' >;
	surfaces: Array< {
		surface_id: PlacementSurface;
		surface_type: 'wall';
		length: EngineeringMeasurement< 'in' >;
		height: EngineeringMeasurement< 'in' >;
		zones: GeometryZone[];
	} >;
}

export type GeometryRecord = EngineeringRecord< GeometryData >;
