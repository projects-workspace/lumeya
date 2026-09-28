# Lumeya public catalog workflow

The public catalogue is authored as structured JSON and rendered by the existing static HTML and JavaScript pages. The browser receives only the generated `discovery-data.js` export.

## Source and templates

- Published editorial records live in `content-source/published/catalog.json`.
- Blank service, practitioner, organisation, place, event-format and scheduled-event templates live in `content-source/templates/`.
- The publisher reads only the one `catalog.json` file under `published/`. It does not read draft folders, private notes, or test fixtures.
- `.vercelignore` excludes all of `content-source/` and `scripts/` from the static deployment. Do not copy private or draft material into the published catalog.

Use a stable lowercase ID for every record. Keep IDs when names change so links between services, providers, places and event formats remain stable. Add relationships by IDs, not by copying display names. Empty optional values may stay empty; renderers show “Not published” for missing information.

Each record in the published file must have `publicationStatus: "published"`. A draft template is not a listing: complete it with source-backed information, validate its relationships and links, then add it to the appropriate collection. The validator fails if a draft or fixture is placed in the published file.

## Validate and publish

From the repository root:

```sh
npm run catalog:validate
npm run catalog:publish
npm run catalog:check
npm run verify
```

`catalog:validate` checks stable and unique IDs, required fields, publication status, category and entity references, local and external links, coordinate verification, and dated-event fields. `catalog:publish` validates first and regenerates `discovery-data.js`; it never edits page renderers. `catalog:check` confirms that the public export matches the published source. The repository release gate runs this check before its existing checks.

## Content rules

- Use only information supported by an existing public source or an approved provider submission. Do not fill blank fields by guessing.
- Do not add reviews, audience figures, performance metrics, prices, dates, map points or partnerships without source evidence.
- Add a dated event only when it has an upcoming ISO `startAt`; `endAt`, when supplied, must be later. The scheduled-event collection is separate from the undated `eventFormats` collection.
- Add coordinates only with `coordinatesVerified: true` and a public `coordinateSourceUrl`. Without both, records remain list-only. Inactive places also remain list-only.
- Do not place client information, health records, credentials or other private material in public catalogue data.
- Publication is not independent verification, professional licensing, certification or a guarantee of outcomes. Preserve the distinction between provider information, a published event date, an explicitly verified map position and any future assessment programme.

The static catalogue can later be exported from an editorial CMS or database if the export follows this structure. Accounts, Provider Space, certification, bookings, payments, messaging and cross-project data sharing remain separate future decisions.
