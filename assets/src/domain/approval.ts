export type ApprovalState =
	| 'draft'
	| 'verified'
	| 'approved'
	| 'deprecated'
	| 'rejected';

export type EngineeringValueStatus =
	| 'verified'
	| 'unverified'
	| 'estimated'
	| 'pending'
	| 'not_applicable';

export type EngineeringMeasurement< Unit extends string > =
	| {
			value: number;
			unit: Unit;
			status: 'verified' | 'unverified' | 'estimated';
	  }
	| { value: null; unit: Unit; status: 'pending' | 'not_applicable' };
