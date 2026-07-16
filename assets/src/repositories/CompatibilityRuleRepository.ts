import type { ApprovalState } from '../domain/approval';
import type { CompatibilityRuleRecord } from '../domain/compatibility';
import {
	assertUnique,
	immutableCopy,
	listByApproval,
} from './integrityValidation';

export class CompatibilityRuleRepository {
	private readonly records: readonly CompatibilityRuleRecord[];
	constructor( records: readonly CompatibilityRuleRecord[] ) {
		assertUnique(
			records,
			( record ) => `${ record.data.rule_id }@${ record.data.revision }`,
			'rule ID/revision'
		);
		this.records = immutableCopy(
			records
		) as readonly CompatibilityRuleRecord[];
	}
	list(
		states: readonly ApprovalState[] = [ 'approved' ]
	): readonly CompatibilityRuleRecord[] {
		return listByApproval(
			this.records,
			states
		) as readonly CompatibilityRuleRecord[];
	}
	resolve(
		id: string,
		revision: string
	): CompatibilityRuleRecord | undefined {
		return this.records.find(
			( record ) =>
				record.data.rule_id === id && record.data.revision === revision
		);
	}
}
