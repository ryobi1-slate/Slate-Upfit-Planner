# Synthetic build-sheet fixtures

No sanitized customer Mercedes build sheets are stored in this repository.
The PHP test harness generates minimal PDFs in the operating-system temporary
directory and deletes each file after the assertion.

The generated cases cover:

- 144 High Roof chassis text and supported vehicle mapping;
- 170 High Roof chassis text and supported vehicle mapping;
- invalid and unrelated 17-character identifiers;
- conflicting wheelbase option codes;
- recognized and bounded unknown option codes;
- a valid PDF with no embedded text;
- malformed and encrypted PDFs;
- the 50-page limit and an over-limit page declaration;
- over-limit extracted text;
- over-limit object declarations.

All VINs are synthetic and contain no customer, buyer, dealer, or deal data.
The fixtures test only mappings documented by the plugin.
