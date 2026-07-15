import type { ApprovalState } from '../domain/approval';
import type { TradePackageRecord } from '../domain/package';
import {
	assertUnique,
	immutableCopy,
	listByApproval,
} from './integrityValidation';

export class PackageRepository {
	private readonly records: readonly TradePackageRecord[];
	constructor( records: readonly TradePackageRecord[] ) {
		assertUnique(
			records,
			( record ) =>
				`${ record.data.package_id }@${ record.data.revision }`,
			'package ID/revision'
		);
		this.records = immutableCopy(
			records
		) as readonly TradePackageRecord[];
	}
	list(
		states: readonly ApprovalState[] = [ 'approved' ]
	): readonly TradePackageRecord[] {
		return listByApproval(
			this.records,
			states
		) as readonly TradePackageRecord[];
	}
	resolve( id: string, revision: string ): TradePackageRecord | undefined {
		return this.records.find(
			( record ) =>
				record.data.package_id === id &&
				record.data.revision === revision
		);
	}
}
