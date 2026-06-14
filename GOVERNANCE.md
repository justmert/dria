# Governance

## Steward
Long-term ownership rests with a named steward: **YK Labs**. The steward is the
lead reviewer for the charter, data, and schema files, holds the top entry in
CODEOWNERS and merge authority, and is the point of accountability for keeping
the project alive.

## Roles
- **Steward** — final reviewer and owner. Reviews changes to `CHARTER.md`,
  `/data`, and `src/lib/schema.ts`. Confirms the no-composite guarantee holds.
- **Maintainers** — review and merge data corrections and feature work, run the
  ingestion, and triage issues and pull requests.
- **Contributors** — anyone. Open an issue or a pull request that edits a data
  file; every populated cell needs a real source URL.

## How changes are decided
- Data corrections and additions: a maintainer review plus passing CI (schema
  validation, the no-composite check, link and slug checks) is enough to merge.
- Schema or charter changes: steward review required (see CODEOWNERS).
- Amending the no-composite rule follows the high bar in `CHARTER.md`.

## Conflict of interest
No undisclosed commercial relationships with the listed protocols or feed
providers. Conflicts are declared. Each feed's funding model and any ties to the
assets or protocols it rates are shown in the product, so a reader can weigh each
rating accordingly.

## Handoff
If the steward changes, the handoff is concrete and recorded in the repository:

1. Transfer of the repository to the new steward.
2. A CODEOWNERS update naming the new steward.
3. A signed commit in which the new steward accepts the role.
