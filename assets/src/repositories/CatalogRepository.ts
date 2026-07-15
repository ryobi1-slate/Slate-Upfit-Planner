import type { ApprovalState } from '../domain/approval';
import type { CatalogProductRecord } from '../domain/catalog';
import {
	assertUnique,
	immutableCopy,
	listByApproval,
} from './integrityValidation';

export class CatalogRepository {
	private readonly records: readonly CatalogProductRecord[];
	constructor( records: readonly CatalogProductRecord[] ) {
		assertUnique(
			records,
			( record ) =>
				`${ record.data.manufacturer }::${ record.data.sku }@${ record.data.data_revision }`,
			'manufacturer/SKU/revision'
		);
		this.records = immutableCopy(
			records
		) as readonly CatalogProductRecord[];
	}
	list(
		states: readonly ApprovalState[] = [ 'approved' ]
	): readonly CatalogProductRecord[] {
		return listByApproval(
			this.records,
			states
		) as readonly CatalogProductRecord[];
	}
	resolve(
		manufacturer: string,
		sku: string,
		revision: string
	): CatalogProductRecord | undefined {
		return this.records.find(
			( record ) =>
				record.data.manufacturer === manufacturer &&
				record.data.sku === sku &&
				record.data.data_revision === revision
		);
	}
}
