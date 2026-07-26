-- Candidate signup now captures optional Resume/CV and Portfolio links
-- (matching the prototype's signup screen). Both nullable - genuinely
-- optional, addable later from the dashboard per the prototype's own copy.
-- Candidate-provided context only: never read by lib/wse/scoring or
-- lib/wse/ciq, never used in matching/ranking, shown on the Prooffile
-- clearly labeled as unverified (PRD Block 6).
alter table candidates
  add column if not exists resume_url text,
  add column if not exists portfolio_url text;
