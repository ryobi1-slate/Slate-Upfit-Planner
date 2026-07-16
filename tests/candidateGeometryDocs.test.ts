import { describe, expect, it } from '@jest/globals';
import { readFileSync, readdirSync } from 'fs';

type CsvRow = Record<string, string>;

const root = 'docs/data-intake';
const candidateDirectory = `${root}/candidate-geometry`;
const sourceValueColumns = [
	'westcan_value',
	'sterling_value',
	'upfit_supply_value',
	'mercedes_oem_value',
];
const requiredWarnings = [
	'Candidate geometry',
	'Verify before production',
	'VIN payload required',
	'Supplier applicability carried forward',
	'Physical fitment review required',
];
const requiredPhysicalChecks = [
	'cargo_front datum',
	'actual partition rear face',
	'wheel-well X start and end',
	'sliding-door opening X start and end',
	'rear usable boundary',
	'major no-mount zones',
	'attachment structure',
	'installed floor condition',
	'installed liner condition',
	'placement-specific door and rear clearance',
];
const allowedEvidenceStates = new Set([
	'published',
	'verified',
	'derived_conservative',
	'candidate',
	'unresolved',
]);
const allowedApprovalLevels = new Set([
	'candidate',
	'approved_for_planning',
	'approved_for_production',
]);

const parseCsvLine = (line: string): string[] => {
	const values: string[] = [];
	let value = '';
	let quoted = false;

	for (let index = 0; index < line.length; index += 1) {
		const character = line[index];
		if (character === '"') {
			if (quoted && line[index + 1] === '"') {
				value += '"';
				index += 1;
			} else {
				quoted = !quoted;
			}
		} else if (character === ',' && !quoted) {
			values.push(value);
			value = '';
		} else {
			value += character;
		}
	}
	values.push(value);

	return values;
};

const parseCsv = (path: string): CsvRow[] => {
	const [headerLine, ...lines] = readFileSync(path, 'utf8').trim().split(/\r?\n/u);
	const headers = parseCsvLine(headerLine);

	return lines.map((line) => {
		const values = parseCsvLine(line);
		return Object.fromEntries(
			headers.map((header, index) => [header, values[index] ?? ''])
		);
	});
};

const metadataValue = (contents: string, key: string): string => {
	const match = contents.match(
		new RegExp('^- ' + key + ': *(?:`([^`]*)`|(.*))$', 'mu')
	);
	return (match?.[1] ?? match?.[2] ?? '').trim();
};

const validateComparison = (rows: CsvRow[]): string[] => {
	const errors: string[] = [];

	for (const row of rows) {
		const minimum = Number(row.minimum_published_value);
		const maximum = Number(row.maximum_published_value);
		const normalized = row.normalized_planning_value
			? Number(row.normalized_planning_value)
			: null;

		if (!allowedEvidenceStates.has(row.evidence_state)) {
			errors.push(`unsupported evidence state: ${row.body_id}/${row.field_id}`);
		}
		if (normalized !== null && (normalized < minimum || normalized > maximum)) {
			errors.push(`normalized value outside range: ${row.body_id}/${row.field_id}`);
		}
		if (normalized !== null && row.evidence_state === 'published') {
			errors.push(`normalized value labeled published: ${row.body_id}/${row.field_id}`);
		}
		if (
			row.normalization_rule === 'single_source_candidate' &&
			!sourceValueColumns.some(
				(column) => row[column] !== '' && Number(row[column]) === normalized
			)
		) {
			errors.push(`candidate value is not a preserved source value: ${row.body_id}/${row.field_id}`);
		}

		let expected = normalized;
		switch (row.normalization_rule) {
			case 'lowest_credible_supported_value':
				expected = minimum;
				break;
			case 'highest_credible_supported_value':
			case 'largest_credible_obstruction':
			case 'largest_credible_clearance':
				expected = maximum;
				break;
			case 'single_source_candidate':
				break;
			case 'unsupported_or_unclear_datum':
				expected = null;
				break;
			default:
				errors.push(`unsupported normalization rule: ${row.body_id}/${row.field_id}`);
		}

		if (normalized !== expected) {
			errors.push(`normalization rule mismatch: ${row.body_id}/${row.field_id}`);
		}
	}

	return errors;
};

describe('candidate geometry documentation', () => {
	const sourceRows = parseCsv(`${root}/sprinter-source-register.csv`);
	const comparisonRows = parseCsv(`${root}/sprinter-geometry-source-comparison.csv`);
	const discrepancyRows = parseCsv(`${root}/sprinter-geometry-discrepancies.csv`);
	const existingSourceRows = parseCsv(`${root}/sprinter-144-high-roof/source-index.csv`);
	const candidateFiles = readdirSync(candidateDirectory).filter((file) =>
		file.endsWith('.md')
	);
	const candidateDocuments = candidateFiles.map((file) => ({
		file,
		contents: readFileSync(`${candidateDirectory}/${file}`, 'utf8'),
	}));

	it('has unique source and geometry record IDs', () => {
		const sourceIds = sourceRows.map((row) => row.source_id);
		const recordIds = candidateDocuments.map(({ contents }) =>
			metadataValue(contents, 'geometry_record_id')
		);

		expect(new Set(sourceIds).size).toBe(sourceIds.length);
		expect(new Set(recordIds).size).toBe(recordIds.length);
		expect(recordIds.every(Boolean)).toBe(true);
	});

	it('validates source references and controlled states', () => {
		const sourceIds = new Set([
			...sourceRows.map((row) => row.source_id),
			...existingSourceRows.map((row) => row.source_id),
		]);

		for (const row of sourceRows) {
			expect(allowedEvidenceStates.has(row.evidence_classification)).toBe(true);
			expect(row.binary_retention).toBe('Retained outside Git');
		}
		for (const { contents } of candidateDocuments) {
			const references = metadataValue(contents, 'source_ids').split(/;\s*/u);
			expect(references.every((sourceId) => sourceIds.has(sourceId))).toBe(true);
			expect(allowedEvidenceStates.has(metadataValue(contents, 'evidence_state'))).toBe(true);
			expect(allowedApprovalLevels.has(metadataValue(contents, 'operational_approval_level'))).toBe(true);
		}
	});

	it('enforces conservative comparison values', () => {
		expect(comparisonRows).toHaveLength(72);
		const comparisonIds = comparisonRows.map(
			(row) => `${row.body_id}/${row.field_id}`
		);
		expect(new Set(comparisonIds).size).toBe(comparisonIds.length);
		expect(validateComparison(comparisonRows)).toEqual([]);
	});

	it('references every fitment-material discrepancy from applicable records', () => {
		for (const discrepancy of discrepancyRows.filter(
			(row) => row.category === 'fitment_material'
		)) {
			for (const bodyId of discrepancy.body_ids.split(';')) {
				const document = candidateDocuments.find(
					({ contents }) => metadataValue(contents, 'body_id') === bodyId
				);
				expect(document?.contents).toContain(discrepancy.discrepancy_id);
			}
		}
	});

	it('keeps candidate-record dimensions synchronized with the comparison matrix', () => {
		for (const { contents } of candidateDocuments) {
			const bodyId = metadataValue(contents, 'body_id');
			const tableRows = [...contents.matchAll(
				/^\| `([^`]+)` \| ([^|]+?) \| `([^`]+)` \|/gmu
			)];
			expect(tableRows.length).toBeGreaterThan(0);

			for (const [, recordField, recordValue, recordRule] of tableRows) {
				const fieldId =
					recordField === 'partition_intrusion'
						? 'partition_depth_or_zone'
						: recordField;
				const comparison = comparisonRows.find(
					(row) => row.body_id === bodyId && row.field_id === fieldId
				);
				expect(comparison).toBeDefined();
				expect(recordValue.trim()).toBe(
					comparison?.normalized_planning_value || 'unresolved'
				);
				expect(recordRule).toBe(comparison?.normalization_rule);
			}
		}
	});

	it('requires planning warnings and prohibits production approval', () => {
		expect(candidateDocuments).toHaveLength(4);
		expect(
			candidateDocuments.filter(
				({ contents }) =>
					metadataValue(contents, 'operational_approval_level') ===
					'approved_for_planning'
			)
		).toHaveLength(2);
		for (const { contents } of candidateDocuments) {
			const approval = metadataValue(contents, 'operational_approval_level');
			expect(approval).not.toBe('approved_for_production');
			if (approval === 'approved_for_planning') {
				for (const warning of requiredWarnings) {
					expect(contents).toContain(`- ${warning}`);
				}
				expect(contents).toContain('approved_for_planning does not authorize installation.');
			}
		}
	});

	it('requires the limited physical-verification list', () => {
		for (const { contents } of candidateDocuments) {
			for (const check of requiredPhysicalChecks) {
				expect(contents).toContain(`- ${check}`);
			}
		}
	});

	it('does not place source PDF binaries in the repository', () => {
		const pdfFiles = readdirSync('.', { recursive: true, encoding: 'utf8' }).filter((path) =>
			path.toLowerCase().endsWith('.pdf')
		);
		expect(pdfFiles).toEqual([]);
	});

	it('rejects invalid rule output', () => {
		const changedRows = comparisonRows.map((row, index) =>
			index === 0 ? { ...row, normalized_planning_value: '999' } : row
		);
		expect(validateComparison(changedRows)).toEqual(
			expect.arrayContaining([
				expect.stringContaining('normalized value outside range'),
				expect.stringContaining('candidate value is not a preserved source value'),
			])
		);
	});
});
