import { describe, expect, it } from '@jest/globals';

declare const require: (moduleName: string) => unknown;

const { readFileSync } = require('fs') as {
	readFileSync: (path: string, encoding: string) => string;
};

type MappingStatus = 'mapped' | 'intake_only' | 'future_schema_candidate';
type WorksheetRow = Record<string, string>;

const worksheetPath =
	'docs/data-intake/sprinter-144-high-roof/geometry-measurement-worksheet.csv';

const allowedStatuses = new Set<MappingStatus>([
	'mapped',
	'intake_only',
	'future_schema_candidate',
]);

const allowedJsonPaths = new Set([
	'data.manufacturer',
	'data.model',
	'data.model_year_range.from',
	'data.model_year_range.to',
	'data.wheelbase.value',
	'data.body_length',
	'data.roof_height',
	'data.drivetrain',
	'data.chassis_variant',
	'data.coordinate_system.origin',
	'data.coordinate_system.x_axis',
	'data.coordinate_system.y_axis',
	'data.coordinate_system.unit',
	'data.rear_boundary.value',
	'data.surfaces[].length.value',
	'data.surfaces[].height.value',
	'data.surfaces[].zones[].from.value',
	'data.surfaces[].zones[].to.value',
	'data.surfaces[].zones[].height.value',
	'data.surfaces[].zones[].depth.value',
	'data.surfaces[].zones[]',
]);

const parseWorksheet = (contents: string): WorksheetRow[] => {
	const [headerLine, ...lines] = contents.trim().split(/\r?\n/u);
	const headers = headerLine.split(',');

	return lines.map((line) => {
		const values = line.split(',');

		return Object.fromEntries(
			headers.map((header, index) => [header, values[index] ?? ''])
		);
	});
};

const validateMappings = (rows: WorksheetRow[]): string[] => {
	const errors: string[] = [];
	const fieldIds = new Set<string>();
	const mappings = new Set<string>();

	for (const row of rows) {
		const { field_id: fieldId, json_path: jsonPath } = row;
		const status = row.schema_mapping_status as MappingStatus;

		if (fieldIds.has(fieldId)) {
			errors.push(`duplicate field_id: ${fieldId}`);
		}
		fieldIds.add(fieldId);

		if (!allowedStatuses.has(status)) {
			errors.push(`invalid schema_mapping_status: ${fieldId}`);
			continue;
		}

		if (status === 'mapped') {
			if (!jsonPath) {
				errors.push(`mapped row has blank json_path: ${fieldId}`);
				continue;
			}
			if (!allowedJsonPaths.has(jsonPath)) {
				errors.push(`unsupported json_path: ${fieldId} -> ${jsonPath}`);
				continue;
			}

			const mappingKey = [jsonPath, row.surface_id, row.zone_id].join('|');
			if (mappings.has(mappingKey)) {
				errors.push(`conflicting duplicate mapping: ${mappingKey}`);
			}
			mappings.add(mappingKey);
		} else if (jsonPath) {
			errors.push(`${status} row has nonblank json_path: ${fieldId}`);
		}
	}

	return errors;
};

describe('geometry intake schema mappings', () => {
	const rows = parseWorksheet(readFileSync(worksheetPath, 'utf8'));

	it('accepts the committed worksheet mappings', () => {
		expect(validateMappings(rows)).toEqual([]);
	});

	it('rejects unsupported pseudo-paths', () => {
		const changedRows = rows.map((row) =>
			row.field_id === 'driver_wall_usable_length'
				? {
						...row,
						json_path: 'data.surfaces[driver_wall].length.value',
				  }
				: row
		);

		expect(validateMappings(changedRows)).toContain(
			'unsupported json_path: driver_wall_usable_length -> data.surfaces[driver_wall].length.value'
		);
	});

	it('rejects invalid statuses and status/path mismatches', () => {
		const changedRows = rows.map((row) => {
			if (row.field_id === 'manufacturer') {
				return { ...row, schema_mapping_status: 'unknown' };
			}
			if (row.field_id === 'coordinate_tolerance') {
				return { ...row, json_path: 'data.coordinate_system.tolerance' };
			}
			if (row.field_id === 'model') {
				return { ...row, json_path: '' };
			}
			return row;
		});

		expect(validateMappings(changedRows)).toEqual(
			expect.arrayContaining([
				'invalid schema_mapping_status: manufacturer',
				'intake_only row has nonblank json_path: coordinate_tolerance',
				'mapped row has blank json_path: model',
			])
		);
	});

	it('rejects duplicate field IDs and conflicting duplicate mappings', () => {
		const duplicate = {
			...rows.find((row) => row.field_id === 'driver_wall_usable_length')!,
		};

		expect(validateMappings([...rows, duplicate])).toEqual(
			expect.arrayContaining([
				'duplicate field_id: driver_wall_usable_length',
				'conflicting duplicate mapping: data.surfaces[].length.value|driver_wall|',
			])
		);
	});
});
