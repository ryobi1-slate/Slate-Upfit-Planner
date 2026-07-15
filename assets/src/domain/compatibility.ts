import type { EngineeringRecord } from './provenance';

export type CompatibilityFact =
	| 'vehicle.vehicle_id'
	| 'vehicle.model'
	| 'vehicle.wheelbase'
	| 'vehicle.body_length'
	| 'vehicle.roof_height'
	| 'vehicle.drivetrain'
	| 'vehicle.chassis_variant'
	| 'vehicle.door_configuration'
	| 'vehicle.payload_capacity'
	| 'configuration.component_weight'
	| 'placement.surface'
	| 'configuration.sku_quantity'
	| 'configuration.present_skus'
	| 'package.package_id'
	| 'package.revision';

export type RuleCondition =
	| { operator: 'all' | 'any'; conditions: RuleCondition[] }
	| { operator: 'not'; condition: RuleCondition }
	| {
			fact: CompatibilityFact;
			operator:
				| 'equals'
				| 'not_equals'
				| 'in'
				| 'not_in'
				| 'greater_than'
				| 'greater_than_or_equal'
				| 'less_than'
				| 'less_than_or_equal'
				| 'contains_all'
				| 'contains_any'
				| 'exists';
			value: unknown;
	  };

export interface CompatibilityRule {
	rule_id: string;
	revision: string;
	scope: 'vehicle' | 'product' | 'package';
	subject: { type: 'vehicle' | 'sku' | 'package'; id: string };
	condition: RuleCondition;
	failure: {
		code: string;
		severity: 'error' | 'warning' | 'info' | 'pending_data';
		blocking: boolean;
		message: string;
	};
}

export type CompatibilityRuleRecord = EngineeringRecord< CompatibilityRule >;
