-- Extend the public-safe candidate identity view (defined in 0006) with the
-- two new candidate-provided-context columns from 0010, so the public
-- Prooffile can render them too - same reasoning as before: expose only
-- through this restricted view, never the base `candidates` table, so a
-- future query can't accidentally leak email by selecting `*`.
create or replace view public_candidate_identity
  with (security_invoker = true)
  as select id, display_name, resume_url, portfolio_url from candidates;
