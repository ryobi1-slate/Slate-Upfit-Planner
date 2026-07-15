import type { EngineeringMeasurement } from './approval';
import type { EngineeringRecord } from './provenance';

export interface TradePackage {
	package_id: string;
	package_name: string;
	revision: string;
	description: string;
	supported_vehicle_ids: string[];
	compatibility_rule_ids: string[];
	components: Array< {
		component_id: string;
		sku: string;
		requirement: 'required' | 'optional';
		quantity: number;
		preferred_surface: 'driver_wall' | 'passenger_wall' | 'any';
		placement_order: number;
		fallback_rule_ids: string[];
		compatibility_rule_ids: string[];
	} >;
	fallback_rules: string[];
	install_estimate: EngineeringMeasurement< 'hours' >;
	lifecycle_status: 'draft' | 'active' | 'deprecated';
}

export type TradePackageRecord = EngineeringRecord< TradePackage >;
