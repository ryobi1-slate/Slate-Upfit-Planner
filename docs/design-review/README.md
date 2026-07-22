# Claude Design Review Workspace

This folder supports controlled visual and usability reviews of the Slate Upfit Planner.

Claude Design may inspect the staging planner and approved reference pages. Claude Design must not edit source code, WordPress, GitHub, staging, or deployment settings. Findings must be reviewed before any implementation work begins.

Approved changes must move through narrow, branch-based pull requests. Merges to `main` auto-deploy to WordPress.com staging. Do not use manual ZIP uploads, SSH, SFTP, or WP-CLI deployment.

Visual recommendations must not change geometry, fitment rules, collision behavior, vehicle boundaries, or product compatibility.

## Workflow

1. Update design context.
2. Run Claude Design review.
3. Save findings.
4. Critically review findings.
5. Move accepted items to the approved backlog.
6. Group accepted work into narrow PRs.
7. Generate Codex implementation prompts.
8. Validate each PR.
9. Merge the approved PR.
10. Verify the auto-deployed staging build.
