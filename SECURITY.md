# NagarDrishti — Security & Privacy Architecture
**Scope**: Security Policies, Secrets Management, RLS, and Data Governance

---

## 1. Security Architecture Principles

1. **Privileged Keys Server-Side Only**:
   - `SUPABASE_SERVICE_ROLE_KEY` and `SARVAM_API_KEY` are NEVER included in client-side bundles.
   - Only `SUPABASE_ANON_KEY` is shared with the frontend for public reads and user authentication.
2. **Row Level Security (RLS) Enforced in Database**:
   - Authorization is enforced by PostgreSQL at the database layer, not merely by frontend route checks.
3. **Citizen Privacy & PII Protection**:
   - Public API endpoints mask reporter personal IDs, phone numbers, and direct email contacts.
   - EXIF location metadata is stripped from photos before public storage exposure.
4. **AI Hallucination Guardrail**:
   - Sarvam LLM is constrained by system prompts requiring explicit source references for every factual claim.
   - If an attribute (e.g. contract cost) is missing from public records, it is explicitly rendered as "Not Available" rather than guessed.
5. **Rate Limiting & Abuse Prevention**:
   - Strict rate limits on feedback submission, AI queries, and voice transcription endpoints.
   - Duplicate submission radius checks to prevent spam flooding.

---

## 2. Phase 6 Production Hardening Roadmap

- [ ] Web Application Firewall (WAF) integration with Cloudflare.
- [ ] Automated virus/malware scanning on media uploads before storage approval.
- [ ] Database Point-in-Time Recovery (PITR) automated backups.
- [ ] IP-based rate limiting via Redis / Upstash in Edge Functions.
- [ ] End-to-end audit log retention compliance (minimum 1 year for administrative changes).
