# Charter

DRIA aggregates what existing DeFi risk feeds publish. It does not produce risk
intelligence of its own. These rules define that boundary and how hard it is to
change. The charter is committed to the repository on purpose: neutrality is a
property of how the project is built, not a promise in a description.

## Articles

### I. No composite scoring
DRIA produces no risk score, rank, weighting, or composite assessment of its own.
Each feed's rating is stored as an opaque value and shown verbatim. A field-name
denylist (`score`, `composite`, `aggregate`, `overall`, `normalized`, `rank`,
`weighted`, `blended`) is enforced on every coverage cell in continuous
integration by `scripts/check-no-composite.ts` and the Zod schema, so a score of
our own cannot be added even by accident.

### II. Verbatim and provenance
Every rating is shown exactly as the provider published it, always with the
feed's name, a live source link, a provenance tag, and a capture date. A rating
never appears next to a number DRIA could be seen to have produced.

### III. Neutrality and conflict disclosure
DRIA picks no winner among feeds. Each feed's funding model and any ties to the
protocols or issuers it rates are disclosed in the product. The project declares
its own conflicts and carries none of its own, since it issues no rating.

### IV. Coverage gaps as data
A missing rating is shown as information, never hidden. Every protocol-by-feed
cell is explicitly labelled covered, partial, or not yet covered. Providers that
cannot be verified as a live product are flagged and left empty, never filled
with invented data.

### V. Open data and correction
The whole dataset is plain files in a public AGPL-3.0 repository, correctable by
pull request. A CODEOWNERS file routes every proposed change to the maintainers
and the steward.

## Coverage status definitions
- **covered** — the feed publishes an assessment for this protocol, captured
  verbatim with a source link.
- **partial** — the feed covers only part of the protocol (a single version,
  market, vault, or asset), or its terms allow only a coverage link, not the
  rating text.
- **not yet covered** — no assessment from this feed exists for this protocol.
  Shown as data, not hidden.
- **flagged** — the provider could not be verified as a live product. Listed for
  transparency; integrated only once it publishes a public dataset.

## Amendment
Changing Article I (no composite scoring) requires all four of the following,
together:

1. Written agreement from the Ethereum Foundation.
2. A supermajority of the project's maintainers.
3. The named steward's sign-off.
4. A publicly recorded rationale, committed to the repository.

Other articles may be amended by maintainer supermajority plus the steward's
sign-off, with the rationale recorded in the repository.
