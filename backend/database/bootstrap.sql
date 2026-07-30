-- Docker bootstrap order: platform schema, tenant template, then fixtures.
\set ON_ERROR_STOP on
\getenv seed_password SEED_PASSWORD
\getenv abc_seed_password ABC_SEED_PASSWORD
\if :{?seed_password}
\else
\echo 'SEED_PASSWORD must be set before database initialization'
\quit
\endif
\if :{?abc_seed_password}
\else
\echo 'ABC_SEED_PASSWORD must be set before database initialization'
\quit
\endif
\i /opt/agentfleet-database/01-platform-schema.sql
CREATE SCHEMA IF NOT EXISTS tenant_vps_dental;
SET search_path TO tenant_vps_dental, public;
\i /opt/agentfleet-database/02-tenant-template.sql
CREATE SCHEMA IF NOT EXISTS tenant_abc_dental;
SET search_path TO tenant_abc_dental, public;
\i /opt/agentfleet-database/02-tenant-template.sql
\i /opt/agentfleet-database/03-seed-data.sql