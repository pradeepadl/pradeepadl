# CDDP Schema — Liquibase Implementation Plan

Source: `files/cdd-erd.html` (reconstructed ERD, 8 modules, ~35 tables).
Target: Postgres, via `spring-boot-starter-liquibase`, changelog composed at
`backend/main/resources/db/changelog/db.changelog-master.yaml` through
`includeAll` on `ddl/` and `dml/`. Files are numbered `000N-description.yaml`;
current baseline is `0001-baseline.yaml` in both folders (tags
`ddl-baseline` / `dml-baseline`). This plan continues the sequence from `0002`.

Decisions locked in for this plan:
- **Enums**: native Postgres `CREATE TYPE ... AS ENUM` for `party_type`,
  `aml_status_type`, `risk_rating_type`, `case_status`.
- **Ambiguous/soft FKs** (`TMSTR_DOCUMENTS.alert_id`, `TMSTR_CASES.case_typ_cd`,
  `TLOG_DUPLICATE_CHECKS.matchd_clnt_id`, `TSUB_DUPLICATE_RESOLUTIONS.matched_client_id`
  / `resolved_client_id`): created as plain typed columns, **no FK constraint**
  yet — added later once the referenced module exists.
- **File granularity**: one file per module, each containing one `changeSet`
  per table, ordered by dependency inside the file.

---

## 1. Global conventions

- **Extensions**: `pgcrypto` (for `gen_random_uuid()`) enabled once, up front.
- **PK strategy**: `uuid` PK, `DEFAULT gen_random_uuid()`, except:
  - `TMSTR_SCHMA_VERS` — `bigint` identity (technical/internal table).
  - 1:1 subtype tables (`TSUB_INDIVIDUAL_DETAILS`, `TSUB_ORGANIZATION_DETAILS`,
    `TSUB_CLIENT_CLASSIFICATIONS`) — PK **is** the FK to the parent row, no
    surrogate key.
  - `TLKP_REGIONS` (`regn_cd`), `TLKP_COUNTRIES` (`ctry_cd`) — natural-key PKs.
  - `TLKP_AML_STATUS_TRANSITIONS` — composite PK `(tenant_id, from_sta, to_sta)`.
- **Audit columns**: the ERD shows `crtd_ts/crtd_nm/last_updd_ts/last_updd_nm`
  inconsistently (footer explicitly says the field lists are "representative,
  not exhaustive"). Plan standardizes these four columns + a `bigint ver`
  optimistic-lock column on every transactional (non-lookup) table, even
  where the ERD omits them, for consistency across the schema.
- **Tenant scoping**: every table except pure lookups (`TLKP_*`) and the
  technical `TMSTR_SCHMA_VERS` carries `tenant_id FK -> TMSTR_TENANTS.id`.
  Row-level security policies are **out of scope** for this DDL pass —
  flagged as a follow-on hardening step.
- **Indexing defaults**: btree index on every FK column; unique index for
  every `UK` marked in the ERD; partial index (`WHERE is_actv`) on lookup
  active flags; GIN index on every `jsonb` column (`cfg_json`, `val_json`,
  `event_data`, `result_data`, `old_row_json`, `new_row_json`, `response_payload`,
  `request_payload`).
- **Enum value sets**: the ERD names the types but not their values. Starter
  sets below are placeholders — **confirm with compliance/business before
  implementing**:
  - `party_type`: `INDIVIDUAL`, `ORGANIZATION`
  - `aml_status_type`: `PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`, `CLOSED`
  - `risk_rating_type`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
  - `case_status`: `OPEN`, `IN_PROGRESS`, `PENDING_REVIEW`, `ESCALATED`, `CLOSED`, `REOPENED`
  - Note: `TLKP_AML_STATUS_TRANSITIONS.from_sta`/`to_sta` are plain `varchar`
    in the ERD, not the `aml_status_type` enum — worth reconciling so the
    transition table can't reference a value the enum doesn't have.

---

## 2. Changelog file plan (dependency-ordered)

| # | File | Contents | Depends on |
|---|------|----------|-------------|
| 0002 | `ddl/0002-foundation.yaml` | `pgcrypto` extension; enum types (`party_type`, `aml_status_type`, `risk_rating_type`, `case_status`) | — |
| 0003 | `ddl/0003-lookups.yaml` | `TLKP_REGIONS`, `TLKP_COUNTRIES`, `TLKP_STATE_PROVINCES`, `TLKP_NM_TYPS`, `TLKP_ID_TYPE`, `TLKP_ADDR_TYP`, `TLKP_CNTC_TYPS`, `TLKP_RELNSHP_TYPE`, `TLKP_RISK_LCTR_TYPE`, `TLKP_ATTR_DEFNS`, `TLKP_DOC_TYPS`, `TLKP_SRCE_SYS`, `TLKP_LOVS` | 0002 |
| 0004 | `ddl/0004-tenant.yaml` | `TMSTR_SCHMA_VERS`, `TMSTR_TENANTS` (self-ref), `TLKP_AML_STATUS_TRANSITIONS` (needs tenant), `TCFG_TENANT_CFGS`, `TCFG_TENANT_ATTRIBUTE_CFGS`, `TCFG_DATA_RTNTN_PLCY` | 0003 |
| 0005 | `ddl/0005-party.yaml` | `TMSTR_PARTIES`, `TSUB_INDIVIDUAL_DETAILS`, `TSUB_ORGANIZATION_DETAILS`, `TSUB_PARTY_NAMES`, `TSUB_PARTY_IDENTIFIERS`, `TSUB_PARTY_CONTACTS`, `TSUB_PARTY_ADDRESSES`, `TREL_PARTY_RELATIONSHIPS` (⚠ created **without** `root_clnt_id` FK — client table doesn't exist yet) | 0003, 0004 |
| 0006 | `ddl/0006-client.yaml` | `TSUB_CLIENT_DETAILS`, `TSUB_CLIENT_CLASSIFICATIONS`, `TSUB_CLIENT_ATTRIBUTES`, `TSUB_CLIENT_JURISDICTIONS`, then a deferred `ALTER TABLE TREL_PARTY_RELATIONSHIPS ADD CONSTRAINT fk_party_rel_root_client FOREIGN KEY (root_clnt_id) REFERENCES TSUB_CLIENT_DETAILS(id)` | 0003, 0005 |
| 0007 | `ddl/0007-documents.yaml` | `TMSTR_DOCUMENTS` (`alert_id` — plain column, no FK; `case_id` — see open question below) | 0004, 0006 |
| 0008 | `ddl/0008-onboarding-duplicates.yaml` | `TMSTR_ONBOARDING_CASES`, `TLOG_DUPLICATE_CHECKS`, `TSUB_DUPLICATE_IDEMPOTENCY`, `TSUB_DUPLICATE_RESOLUTIONS` | 0004, 0006 |
| 0009 | `ddl/0009-cases.yaml` | `TMSTR_CASES` (`case_typ_cd` — plain column, no FK), `TSUB_CASE_EVENTS`, deferred `ALTER TABLE TMSTR_DOCUMENTS ADD COLUMN case_id ...` if the open question below resolves to "yes" | 0004, 0006 |
| 0010 | `ddl/0010-audit.yaml` | `TADT_AUDIT_LOGS`, `TLOG_PROCESS_LOGS` | 0004 |

Matching `dml/` files:

| # | File | Contents |
|---|------|----------|
| 0002 | `dml/0002-lookups-seed.yaml` | ISO region/country reference data for `TLKP_REGIONS`/`TLKP_COUNTRIES`, plus fixed code values for the static type lookups (`TLKP_NM_TYPS`, `TLKP_ID_TYPE`, `TLKP_ADDR_TYP`, `TLKP_CNTC_TYPS`, `TLKP_RELNSHP_TYPE`, `TLKP_RISK_LCTR_TYPE`, `TLKP_DOC_TYPS`) |

`TLKP_AML_STATUS_TRANSITIONS` is per-tenant data, not global reference data —
seeded per-tenant at onboarding time (app logic or test fixtures), not in the
baseline `dml/`.

---

## 3. Relationship / FK matrix

| Child table | FK column | References | Notes |
|---|---|---|---|
| `TMSTR_TENANTS` | `parent_tenant_id` | `TMSTR_TENANTS.id` | self-referencing hierarchy |
| `TMSTR_TENANTS` | `regn_cd` | `TLKP_REGIONS.regn_cd` | |
| `TCFG_TENANT_CFGS` / `TCFG_TENANT_ATTRIBUTE_CFGS` / `TCFG_DATA_RTNTN_PLCY` | `tenant_id` | `TMSTR_TENANTS.id` | |
| `TLKP_AML_STATUS_TRANSITIONS` | `tenant_id` | `TMSTR_TENANTS.id` | part of composite PK |
| `TLKP_COUNTRIES` | `regn_cd` | `TLKP_REGIONS.regn_cd` | |
| `TLKP_STATE_PROVINCES` | `ctry_cd` | `TLKP_COUNTRIES.ctry_cd` | |
| `TMSTR_PARTIES` | `tenant_id` | `TMSTR_TENANTS.id` | |
| `TSUB_INDIVIDUAL_DETAILS` | `prty_id` | `TMSTR_PARTIES.id` | PK = FK, 1:1 |
| `TSUB_ORGANIZATION_DETAILS` | `prty_id` | `TMSTR_PARTIES.id` | PK = FK, 1:1; `inc_ctry` → `TLKP_COUNTRIES.ctry_cd` |
| `TSUB_PARTY_NAMES` | `prty_id` / `nm_typ_cd` | `TMSTR_PARTIES.id` / `TLKP_NM_TYPS.cd` | |
| `TSUB_PARTY_IDENTIFIERS` | `prty_id` / `id_typ_cd` / `issg_ctry` | `TMSTR_PARTIES.id` / `TLKP_ID_TYPE.cd` / `TLKP_COUNTRIES.ctry_cd` | |
| `TSUB_PARTY_CONTACTS` | `prty_id` / `cntc_typ_cd` | `TMSTR_PARTIES.id` / `TLKP_CNTC_TYPS.cd` | |
| `TSUB_PARTY_ADDRESSES` | `prty_id` / `addr_typ_cd` / `ctry_cd` | `TMSTR_PARTIES.id` / `TLKP_ADDR_TYP.cd` / `TLKP_COUNTRIES.ctry_cd` | |
| `TREL_PARTY_RELATIONSHIPS` | `tenant_id` / `subs_prty_id` / `reld_prty_id` / `relnshp_typ_cd` | `TMSTR_TENANTS.id` / `TMSTR_PARTIES.id` (×2) / `TLKP_RELNSHP_TYPE.cd` | `root_clnt_id` FK added in 0006 (see above) |
| `TSUB_CLIENT_DETAILS` | `prty_id` / `tenant_id` / `ctry_cd` / `regn_cd` | `TMSTR_PARTIES.id` / `TMSTR_TENANTS.id` / `TLKP_COUNTRIES.ctry_cd` / `TLKP_REGIONS.regn_cd` | |
| `TSUB_CLIENT_CLASSIFICATIONS` | `clnt_id` | `TSUB_CLIENT_DETAILS.id` | PK = FK, 1:1 |
| `TSUB_CLIENT_ATTRIBUTES` | `clnt_id` / `attr_cd` | `TSUB_CLIENT_DETAILS.id` / `TLKP_ATTR_DEFNS.attr_cd` | |
| `TSUB_CLIENT_JURISDICTIONS` | `clnt_id` / `ctry_cd` | `TSUB_CLIENT_DETAILS.id` / `TLKP_COUNTRIES.ctry_cd` | |
| `TMSTR_DOCUMENTS` | `tenant_id` / `client_id` | `TMSTR_TENANTS.id` / `TSUB_CLIENT_DETAILS.id` | `alert_id` unconstrained |
| `TMSTR_ONBOARDING_CASES` | `tenant_id` / `client_id` | `TMSTR_TENANTS.id` / `TSUB_CLIENT_DETAILS.id` | |
| `TLOG_DUPLICATE_CHECKS` | `tenant_id` | `TMSTR_TENANTS.id` | `matchd_clnt_id` unconstrained (no FK marker in ERD) |
| `TSUB_DUPLICATE_IDEMPOTENCY` | `tenant_id` / `dup_chk_id` | `TMSTR_TENANTS.id` / `TLOG_DUPLICATE_CHECKS.id` | |
| `TSUB_DUPLICATE_RESOLUTIONS` | `tenant_id` / `dup_chk_id` | `TMSTR_TENANTS.id` / `TLOG_DUPLICATE_CHECKS.id` | `matched_client_id`/`resolved_client_id` unconstrained |
| `TMSTR_CASES` | `tenant_id` / `clnt_id` | `TMSTR_TENANTS.id` / `TSUB_CLIENT_DETAILS.id` | `case_typ_cd` unconstrained |
| `TSUB_CASE_EVENTS` | `case_id` | `TMSTR_CASES.id` | |
| `TADT_AUDIT_LOGS` / `TLOG_PROCESS_LOGS` | `tenant_id` | `TMSTR_TENANTS.id` | |

---

## 4. Open questions before implementation

1. **`TMSTR_CASES ||--o{ TMSTR_DOCUMENTS : attaches`** is drawn in the ERD,
   but `TMSTR_DOCUMENTS` has no `case_id` column in its field list — only
   `client_id` and `alert_id`. Do we add a nullable `case_id` FK to
   `TMSTR_DOCUMENTS` to make this relationship real, or is "attaches" meant
   loosely (documents are just filtered by shared `client_id`)?
2. **`TMSTR_ONBOARDING_CASES ||--o{ TLOG_DUPLICATE_CHECKS : triggers`** —
   same gap: `TLOG_DUPLICATE_CHECKS` has no `onboarding_case_id` column.
   Same question as above.
3. Enum value sets (§1) need sign-off from whoever owns the AML status
   workflow and case lifecycle before `CREATE TYPE` is written.
4. Confirm target schema: plan assumes tables land in the default/public
   schema (no schema-qualification seen elsewhere in the existing
   `ddl/0001-baseline.yaml`). Say if `cddp` should be a dedicated schema.

---

## 5. Next step

Once the two relationship gaps in §4 and the enum value sets are confirmed,
implement `0002`–`0010` in order, running `mvn spring-boot:run` (or the
project's test Liquibase profile) after each file to catch dependency-order
mistakes early rather than batching all nine files before the first run.