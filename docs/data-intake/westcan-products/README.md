# Westcan product source register

This directory registers the price-removed `WestcanList_2026-07-21(1).xlsx`
workbook dated 2026-07-21. Its single worksheet contains 1,527 source rows.
The original XLSX and product-guide PDF remain in the controlled engineering
source archive and are not committed to Git.

`westcan-product-register.csv` preserves source values for controlled review:

- `source_row_id` is a stable row-level intake identifier.
- `source_weight_lb` contains only positive published weights.
- `weight_status` distinguishes published, blank, zero, and invalid values.
- `package_length`, `package_width`, and `package_height` are shipment-package
  dimensions. They are not installed product dimensions.
- `category_candidate` is a conservative, provisional classification and does
  not activate a product.
- `runtime_candidate` records the explicit activation decision.

Blank and zero weights are unavailable; zero is not treated as a verified
zero-pound product. No missing weight is estimated. The source has no pricing
columns. Only SKUs 22-3436 through 22-3440 are `approved_initial`; all other
valid rows require product-family review before runtime activation.

Installed dimensions for those five products were visually verified against
page 14 of the Westcan Mercedes Sprinter + Metris Aluminum Product Guide. The
guide lists the 62-inch-high, three-shelf units at 24, 36, 48, 60, and 72 inches
long, 16 1/8 inches deep, with one 12-inch and two 14-inch shelf depths.

Logical archive locators:

- `slate-engineering-source-archive/westcan-products/WestcanList_2026-07-21.xlsx`
- `slate-engineering-source-archive/sprinter-candidate-geometry/Mercedes-2026-web-july-8.pdf`
