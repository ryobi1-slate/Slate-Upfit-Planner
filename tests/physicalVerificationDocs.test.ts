import { describe, expect, it } from '@jest/globals';
import { readFileSync, readdirSync } from 'fs';

type CsvRow = Record<string, string>;

const directory = 'docs/data-intake/physical-verification';
const worksheetNames = [
	'sprinter-144-high-roof-worksheet.csv',
	'sprinter-170-high-roof-worksheet.csv',
];
const expectedBodies = new Set([
	'sprinter-144-high-roof',
	'sprinter-170-high-roof',
]);
const expectedChecks = new Set(
	Array.from({ length: 10 }, (_, index) => `PV-${String(index + 1).padStart(3, '0')}`)
);
const requiredKeys = new Set([
	'cargo_front_datum_definition',
	'partition_presence',
	'partition_rear_face_x',
	'driver_wheel_well_x_start',
	'driver_wheel_well_x_end',
	'passenger_wheel_well_x_start',
	'passenger_wheel_well_x_end',
	'passenger_sliding_door_x_start',
	'passenger_sliding_door_x_end',
	'driver_rear_usable_boundary_x',
	'passenger_rear_usable_boundary_x',
	'major_no_mount_zone',
	'attachment_structure_at_proposed_location',
	'installed_floor_type',
	'installed_floor_thickness',
	'floor_measurement_reference',
	'installed_liner_type',
	'installed_liner_thickness',
	'liner_mounting_impact',
	'placement_specific_door_clearance',
	'placement_specific_rear_clearance',
]);
const allowedStatuses = new Set([
	'not_measured',
	'measured',
	'needs_recheck',
	'ready_for_review',
	'accepted',
	'rejected',
	'not_applicable',
]);
const expectedCandidateReferences: Record<string, Record<string, string>> = {
	'sprinter-144-high-roof': {
		driver_usable_wall_height: '74.75',
		passenger_usable_wall_height: '74.75',
		driver_shelving_space: '116',
		passenger_shelving_space: '71',
		driver_wheel_well_length: '36.5',
		passenger_wheel_well_length: '36.5',
		driver_wheel_well_depth: '9',
		passenger_wheel_well_depth: '9',
		driver_wheel_well_height: '12.5',
		passenger_wheel_well_height: '12.5',
		passenger_sliding_door_opening_width: '50',
	},
	'sprinter-170-high-roof': {
		driver_usable_wall_height: '74.75',
		passenger_usable_wall_height: '74.75',
		driver_shelving_space: '155',
		passenger_shelving_space: '110',
		driver_wheel_well_length: '36.5',
		passenger_wheel_well_length: '36.5',
		driver_wheel_well_depth: '9',
		passenger_wheel_well_depth: '9',
		driver_wheel_well_height: '12.5',
		passenger_wheel_well_height: '12.5',
		passenger_sliding_door_opening_width: '51',
	},
};

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

const parseCsv = (path: string): { headers: string[]; rows: CsvRow[] } => {
	const [headerLine, ...lines] = readFileSync(path, 'utf8').trim().split(/\r?\n/u);
	const headers = parseCsvLine(headerLine);
	return {
		headers,
		rows: lines.map((line) => {
			const values = parseCsvLine(line);
			return Object.fromEntries(
				headers.map((header, index) => [header, values[index] ?? ''])
			);
		}),
	};
};

const metadataValue = (contents: string, key: string): string => {
	const match = contents.match(
		new RegExp('^- ' + key + ': *(?:`([^`]*)`|(.*))$', 'mu')
	);
	return (match?.[1] ?? match?.[2] ?? '').trim();
};

const isAllowedArchiveLocator = (value: string): boolean =>
	value === '' || !/^(?:[A-Za-z]:[\\/]|\/)/u.test(value);

describe('physical verification documentation', () => {
	const worksheets = worksheetNames.map((name) => ({
		name,
		...parseCsv(`${directory}/${name}`),
	}));
	const allRows = worksheets.flatMap(({ rows }) => rows);

	it('contains exactly two body-specific worksheets with identical headers', () => {
		const actualNames = readdirSync(directory)
			.filter((name) => name.endsWith('-worksheet.csv'))
			.sort();
		expect(actualNames).toEqual([...worksheetNames].sort());
		const firstHeaders = worksheets[0]?.headers;
		if (!firstHeaders) {
			throw new Error('No physical-verification worksheets were found');
		}
		for (const worksheet of worksheets) {
			expect(worksheet.headers).toEqual(firstHeaders);
		}
		expect(new Set(allRows.map((row) => row.body_id))).toEqual(expectedBodies);
	});

	it('covers PV-001 through PV-010 and all runtime and production keys', () => {
		for (const { rows } of worksheets) {
			expect(new Set(rows.map((row) => row.check_id))).toEqual(expectedChecks);
			const keys = new Set(rows.map((row) => row.measurement_key));
			for (const key of requiredKeys) {
				expect(keys.has(key)).toBe(true);
			}
		}
	});

	it('keeps template IDs unique and all physical fields blank', () => {
		const ids = allRows.map((row) => row.template_row_id);
		expect(new Set(ids).size).toBe(ids.length);
		for (const row of allRows) {
			expect(allowedStatuses.has(row.measurement_status)).toBe(true);
			expect(['accepted', 'ready_for_review']).not.toContain(
				row.measurement_status
			);
			for (const field of [
				'verification_session_id',
				'vehicle_vin_last8',
				'model_year',
				'wheelbase',
				'roof',
				'chassis',
				'drivetrain',
				'partition_condition',
				'floor_condition',
				'liner_condition',
				'observation_1',
				'observation_2',
				'accepted_value',
				'evidence_ids',
				'measured_by',
				'measured_at',
				'reviewed_by',
				'reviewed_at',
			]) {
				expect(row[field]).toBe('');
			}
		}
	});

	it('preserves controlled candidate references outside physical observations', () => {
		for (const { name, rows } of worksheets) {
			const bodyId = rows[0]?.body_id;
			if (!bodyId) {
				throw new Error(
					`Physical-verification worksheet ${name} contains no rows or is missing body_id`
				);
			}
			const expected = expectedCandidateReferences[bodyId];
			const actual = Object.fromEntries(
				rows
					.filter((row) => row.candidate_reference_value !== '')
					.map((row) => [
						row.measurement_key,
						row.candidate_reference_value,
					])
			);
			expect(actual).toEqual(expected);
			for (const [key, value] of Object.entries(expected)) {
				const row = rows.find((candidate) => candidate.measurement_key === key);
				expect(row?.candidate_reference_value).toBe(value);
				expect(row?.observation_1).toBe('');
				expect(row?.observation_2).toBe('');
				expect(row?.accepted_value).toBe('');
			}
			const partition = rows.find(
				(row) => row.measurement_key === 'partition_rear_face_x'
			);
			expect(partition?.candidate_reference_value).toBe('');
			expect(partition?.notes).toContain('incompatible boundaries');
		}
	});

	it('retains approval levels and production boundaries', () => {
		const candidateFiles = [
			'docs/data-intake/candidate-geometry/sprinter-144-high-roof.md',
			'docs/data-intake/candidate-geometry/sprinter-144-standard-roof.md',
			'docs/data-intake/candidate-geometry/sprinter-170-high-roof.md',
			'docs/data-intake/candidate-geometry/sprinter-170-extended-high-roof.md',
		];
		const approvals = candidateFiles.map((path) =>
			metadataValue(readFileSync(path, 'utf8'), 'operational_approval_level')
		);
		expect(approvals.filter((value) => value === 'approved_for_planning')).toHaveLength(2);
		expect(approvals).not.toContain('approved_for_production');

		for (const row of allRows.filter((item) =>
			['PV-007', 'PV-010'].includes(item.check_id)
		)) {
			expect(row.measurement_status).toBe('not_applicable');
			expect(row.side).toBe('placement-specific');
			expect(row.notes).toContain('production-only');
			expect(row.notes).toContain('actual product placement');
		}
	});

	it('keeps photo evidence blank and rejects workstation archive paths', () => {
		const { rows } = parseCsv(`${directory}/photo-index-template.csv`);
		expect(rows).toHaveLength(1);
		for (const row of rows) {
			expect(row.evidence_id).toBe('');
			expect(row.filename).toBe('');
			expect(row.sha256).toBe('');
			expect(isAllowedArchiveLocator(row.archive_locator)).toBe(true);
		}
	});

	it('allows blank and logical archive locators but rejects absolute paths', () => {
		expect(isAllowedArchiveLocator('')).toBe(true);
		expect(
			isAllowedArchiveLocator(
				'slate-engineering-evidence/sprinter-physical-verification/session-id/photo.jpg'
			)
		).toBe(true);
		expect(isAllowedArchiveLocator('C:\\folder\\photo.jpg')).toBe(false);
		expect(isAllowedArchiveLocator('C:/folder/photo.jpg')).toBe(false);
		expect(isAllowedArchiveLocator('/home/user/photo.jpg')).toBe(false);
		expect(isAllowedArchiveLocator('/mnt/evidence/photo.jpg')).toBe(false);
	});

	it('contains no evidence binaries in the field package', () => {
		const binaryExtensions = /\.(?:pdf|jpe?g|png|heic|gif|tiff?|webp)$/iu;
		const binaries = readdirSync(directory, {
			recursive: true,
			encoding: 'utf8',
		}).filter((path) => binaryExtensions.test(path));
		expect(binaries).toEqual([]);
	});
});
