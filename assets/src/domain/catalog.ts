import type { EngineeringMeasurement } from './approval';
import type { EngineeringRecord } from './provenance';
import type { PlacementSurface } from './vehicle';

export interface CatalogProduct {
	manufacturer: string;
	sku: string;
	product_name: string;
	description: string;
	category: string;
	subcategory: string;
	dimensions: {
		length: EngineeringMeasurement< 'in' >;
		depth: EngineeringMeasurement< 'in' >;
		height: EngineeringMeasurement< 'in' >;
	};
	published_weight: EngineeringMeasurement< 'lb' >;
	estimated_install_hours: EngineeringMeasurement< 'hours' >;
	placement_surface: PlacementSurface[];
	placement_mode: 'wall_mounted' | 'pending';
	supported_vehicle_rule_ids: string[];
	supported_roof_rules: string[];
	required_clearances: string[];
	required_accessories: string[];
	excluded_products: string[];
	required_products: string[];
	quantity_limits: { minimum: number; maximum: number | null };
	product_family: string;
	lifecycle_status: 'draft' | 'active' | 'deprecated';
	data_revision: string;
}

export type CatalogProductRecord = EngineeringRecord< CatalogProduct >;
