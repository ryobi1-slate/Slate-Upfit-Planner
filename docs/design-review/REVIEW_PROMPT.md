# Claude Design Review Prompt

## Review Metadata

- **Current main SHA:** `{{CURRENT_MAIN_SHA}}`
- **Active PRs:** `{{ACTIVE_PRS}}`
- **Current staging asset marker:** `{{STAGING_ASSET_MARKER}}`
- **Known defects:** `{{KNOWN_DEFECTS}}`
- **Review date:** `{{REVIEW_DATE}}`

## Prompt

Review the Slate Upfit Planner as a controlled visual and usability assessment.

Inspect the actual staging page:

- https://staging-6c9f-infod7ae72dc14c-qjuxg.wpcomstaging.com/standalone-upfit-planner-test/

Inspect the Dealer Portal Products page as the primary visual reference:

- https://dealers-slatebuilt.com/products/

Review at these exact viewport sizes:

- 1440 × 900
- 1024 × 768
- 768 × 1024
- 430 × 932
- 390 × 844
- 375 × 812

Assess:

- Visual hierarchy
- First-use clarity
- Vehicle and wall selectors
- Product cards
- Product placement workflow
- Planner canvas
- Fit status
- Warnings and errors
- Responsive behavior
- Touch targets
- Accessibility
- B2B professionalism

Separate findings into:

1. Verified defects
2. Dealer Portal consistency gaps
3. Useful refinements
4. Personal preferences

For every finding, recommend the smallest useful correction. Do not provide implementation code. Do not suggest geometry, fitment, collision, boundary, compatibility, or product-placement behavior changes for visual reasons. Do not suggest excluded features such as pricing, packages, quotes, checkout, inventory, Dealer Portal integration, Business Central integration, or retail workflows. Do not edit source code, WordPress, GitHub, or staging.

For each finding, provide:

- Priority
- Evidence
- Proposed change
- User benefit
- Likely component
- Behavior risk
- Decision recommendation
- Narrow PR scope
- Validation checks

Use the Slate brand direction and the Dealer Portal Products page as references, but separate objective problems from personal design preferences.
