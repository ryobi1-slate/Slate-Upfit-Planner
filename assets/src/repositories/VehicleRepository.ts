import type { ApprovalState } from '../domain/approval';
import type { VehicleRecord } from '../domain/vehicle';
import {
	assertUnique,
	immutableCopy,
	listByApproval,
} from './integrityValidation';

export class VehicleRepository {
	private readonly records: readonly VehicleRecord[];
	constructor( records: readonly VehicleRecord[] ) {
		assertUnique(
			records,
			( record ) =>
				`${ record.data.vehicle_id }@${ record.metadata.record_revision }`,
			'vehicle ID/revision'
		);
		this.records = immutableCopy( records ) as readonly VehicleRecord[];
	}
	list(
		states: readonly ApprovalState[] = [ 'approved' ]
	): readonly VehicleRecord[] {
		return listByApproval(
			this.records,
			states
		) as readonly VehicleRecord[];
	}
	resolve( id: string, revision: string ): VehicleRecord | undefined {
		return this.records.find(
			( record ) =>
				record.data.vehicle_id === id &&
				record.metadata.record_revision === revision
		);
	}
}
