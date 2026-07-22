# Dealer Portal visual reference

The planner layout uses the Dealer Portal repository as a read-only visual
reference. No Dealer Portal files were changed or copied into this repository.

## Reference files and selectors

- `assets/css/slate-design-tokens.css`: color, spacing, radius, border, shadow,
  and type-scale tokens.
- `assets/css/slate-portal.css`: `.slate-page`, `.slate-page-header`,
  `.slate-page-title`, `.slate-page-description`, `.slate-card`, form controls,
  buttons, and responsive content grids.
- `templates/products.php`: page-header hierarchy, compact filter controls,
  flat catalog cards, status pills, and catalog-grid density.
- `includes/ui/layout-shell.php`: Portal content-shell hierarchy and spacing.
- `includes/ui/topbar.php` and `includes/ui/sidebar.php`: evidence that global
  navigation belongs to the Portal shell and should not be duplicated by the
  embedded planner.

## Adaptation boundaries

The redesign applies those patterns to the planner's presentation only. It does
not change vehicle geometry, fitment rules, placement behavior, product data,
payload calculations, REST/PHP behavior, or deployment configuration. The
technical plan continues to show only verified geometry already present in the
planner; unsupported dimensions or body-outline details were not invented.
