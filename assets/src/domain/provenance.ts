import type { ApprovalState } from './approval';

export interface SourceReference {
	title: string;
	reference: string | null;
	retrieved_on: string | null;
}

export interface ProvenanceMetadata {
	record_revision: string;
	approval_state: ApprovalState;
	source: SourceReference;
	prepared_by: string | null;
	verified_by: string | null;
	approved_by: string | null;
	last_verified: string | null;
	change_summary: string;
}

export interface EngineeringRecord< T > {
	schema_version: '1.0';
	metadata: ProvenanceMetadata;
	data: T;
}
