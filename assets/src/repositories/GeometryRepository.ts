import type { ApprovalState } from '../domain/approval';
import type { GeometryRecord } from '../domain/geometry';
import {
	assertUnique,
	immutableCopy,
	listByApproval,
} from './integrityValidation';

export class GeometryRepository {
	private readonly records: readonly GeometryRecord[];
	constructor( records: readonly GeometryRecord[] ) {
		assertUnique(
			records,
			( record ) =>
				`${ record.data.geometry_id }@${ record.data.geometry_revision }`,
			'geometry ID/revision'
		);
		this.records = immutableCopy( records ) as readonly GeometryRecord[];
	}
	list(
		states: readonly ApprovalState[] = [ 'approved' ]
	): readonly GeometryRecord[] {
		return listByApproval(
			this.records,
			states
		) as readonly GeometryRecord[];
	}
	resolve( id: string, revision: string ): GeometryRecord | undefined {
		return this.records.find(
			( record ) =>
				record.data.geometry_id === id &&
				record.data.geometry_revision === revision
		);
	}
}
