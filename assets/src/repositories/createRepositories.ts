import type { CatalogProductRecord } from '../domain/catalog';
import type { CompatibilityRuleRecord } from '../domain/compatibility';
import type { GeometryRecord } from '../domain/geometry';
import type { TradePackageRecord } from '../domain/package';
import type { VehicleRecord } from '../domain/vehicle';
import { CatalogRepository } from './CatalogRepository';
import { CompatibilityRuleRepository } from './CompatibilityRuleRepository';
import { GeometryRepository } from './GeometryRepository';
import { PackageRepository } from './PackageRepository';
import { validateRepositoryReferences } from './integrityValidation';
import { VehicleRepository } from './VehicleRepository';

export function createRepositories( input: {
	vehicles: readonly VehicleRecord[];
	geometries: readonly GeometryRecord[];
	catalog: readonly CatalogProductRecord[];
	rules: readonly CompatibilityRuleRecord[];
	packages: readonly TradePackageRecord[];
} ) {
	validateRepositoryReferences( input );
	return Object.freeze( {
		vehicles: new VehicleRepository( input.vehicles ),
		geometries: new GeometryRepository( input.geometries ),
		catalog: new CatalogRepository( input.catalog ),
		rules: new CompatibilityRuleRepository( input.rules ),
		packages: new PackageRepository( input.packages ),
	} );
}
