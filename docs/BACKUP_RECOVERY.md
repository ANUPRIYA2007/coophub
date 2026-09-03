# COOP HUB — Backup, Disaster Recovery & High-Availability Plan

## 1. Executive Summary & Truthful Operational Status

| Dimension | Truthful Operational Status | Operational Evidence & Scope |
| :--- | :--- | :--- |
| **Backup Automation** | **`NOT CONFIGURED`** | Automated cloud WAL archiving requires managed Supabase Pro/Enterprise tier PITR enablement or scheduled cloud storage export. |
| **Physical Dump Procedure** | **`IMPLEMENTED`** | Schema and data export procedures defined via `pg_dump` and Supabase CLI. |
| **Recovery Time Objective (RTO)** | **< 30 Minutes** | Target time to provision fresh Postgres instance and restore from full SQL snapshot. |
| **Recovery Point Objective (RPO)** | **< 1 Hour (Snapshots) / 2 Min (PITR)** | Daily snapshot standard: 24h. Scheduled hourly logical dump: 1h. Continuous WAL archiving (PITR): ~2 min. |
| **Live Disaster Recovery Drill** | **`NOT EXECUTED`** | Live failover drill to a secondary cloud region has not been executed. |

---

## 2. Recovery Objectives

```
+-------------------------------------------------------------------------+
|                              DATA LOSS WINDOW                           |
|                       <------------- RPO ------------->                 |
|                              (Target: < 1 Hour)                         |
|                                                                         |
|  Last Valid Backup                                             Incident |
|  [Backup Event] ---------------------------------------------> [Outage] |
|                                                                   |     |
|                                                                   v     |
|                                                          [Recovery Start]
|                                                                   |     |
|                      <------------- RTO ------------->            |     |
|                             (Target: < 30 Mins)                   v     |
|                                                          [Fully Restored]
+-------------------------------------------------------------------------+
```

---

## 3. Database Snapshot & Dump Procedures

### 3.1 Logical Backup via Supabase CLI
```bash
# Export complete schema (DDL, constraints, RLS policies, triggers)
npx supabase db dump -f supabase/backups/schema_$(date +%Y%m%d_%H%M%S).sql

# Export data only (DML records, excluding system schemas)
npx supabase db dump --data-only -f supabase/backups/data_$(date +%Y%m%d_%H%M%S).sql
```

### 3.2 Native PostgreSQL Dump (Direct Connection)
```bash
# Direct pg_dump with custom compressed format
pg_dump "$DATABASE_URL" \
  --format=custom \
  --file=coophub_backup_$(date +%Y%m%d).dump \
  --verbose \
  --exclude-schema='extensions|graphql|vault'
```

---

## 4. Restoration Runbook

### Step 1: Cluster Health Assessment
1. Determine extent of incident (corrupted table vs full cluster outage).
2. Stop application traffic by redirecting load balancer to maintenance page:
   ```bash
   # In nginx/nginx.conf, enable 503 maintenance block
   docker compose exec nginx nginx -s reload
   ```

### Step 2: Database Restoration
```bash
# Drop corrupted database or provision target schema
pg_restore \
  --dbname="$NEW_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --verbose coophub_backup_YYYYMMDD.dump
```

### Step 3: Run Database Health & Migration Verification
```bash
# Verify schema integrity
node -e "
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
s.from('service_requests').select('count').then(r => console.log('Requests count:', r.count));
"
```

### Step 4: Resume Production Traffic
1. Start backend nodes: `docker compose up -d`
2. Validate `/api/health` and `/api/ready` on all 3 instances.
3. Reload Nginx load balancer to restore round-robin routing.

---

## 5. Storage Buckets Disaster Recovery

The private KYC document bucket (`kyc_documents`) and request attachments (`request_attachments`) are stored in Supabase Storage.
- Objects in `kyc_documents` are encrypted at rest with AES-256.
- In disaster scenarios, storage objects must be restored from S3-compatible replication snapshots before reactivating technician KYC verification.
