package com.cddp.ai.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Plain JdbcTemplate lookup rather than a JPA entity, deliberately: this
 * is a read-only endpoint that exists to give the kyc-risk-summarizer
 * agent's JavaBackendTool something real to call (see
 * pySDK/services/kyc-risk-agent/agent.py). tmstr_cases.case_sta is a
 * native Postgres enum (case_status) — mapping that through Hibernate's
 * ddl-auto=validate would need extra type-mapping machinery this
 * single-column read doesn't justify; a `::text` cast sidesteps it.
 */
@Repository
public class CaseLookupRepository {

    private static final String SELECT_CASE_BY_ID = """
            SELECT id, case_num, clnt_id, case_typ_cd, case_sta::text AS case_sta,
                   descr, prlty, due_dt, crtd_ts
            FROM tmstr_cases
            WHERE id = ?
            """;

    private final JdbcTemplate jdbcTemplate;

    public CaseLookupRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public Optional<Map<String, Object>> findById(UUID caseId) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(SELECT_CASE_BY_ID, caseId);
        return rows.stream().findFirst();
    }
}
