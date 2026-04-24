# Scout Audit Checklist — Governing Artefact

**Purpose:** Canonical pass/fail checklist for every Scout change before merge/deploy. Operated via `checklist-audit-cognitive-mode` — each row is a deterministic test, not a narrative. No item ships green without stdout proof.

**Owner:** §281 Engine 3 (Verification) | **Auto-runs:** on every `za-hcs-perfect-code.sh` execution + pre-deploy | **Scope:** `~/Developer/za-scout-questionnaire`

Reviewers: never read linearly. Audit each row. Missing rows = rule violation per `comprehensive-capture-hr`.

---

## A. Security (P0 — ship blockers)

| # | Item | Proof command | Pass criteria |
|---|---|---|---|
| A1 | Zod schema guards every field | `grep -c "QuestionnaireSchema = z.object" app/api/submit/route.ts` | `= 1` |
| A2 | Body cap enforced | `grep -c "MAX_BODY_BYTES" app/api/submit/route.ts` | `>= 2` |
| A3 | Content-Type gate | `curl -sw "%{http_code}" -X POST <BASE>/api/submit -H "Content-Type: text/plain" -d x` | `= 415` |
| A4 | CSP header live | `curl -sI <BASE>/ \| grep -ci content-security-policy` | `>= 1` |
| A5 | X-Frame-Options: DENY | `curl -sI <BASE>/ \| grep -ci "x-frame-options: DENY"` | `>= 1` |
| A6 | Referrer-Policy + Permissions-Policy | `curl -sI <BASE>/ \| grep -Eci "referrer-policy\|permissions-policy"` | `>= 2` |
| A7 | HSTS preload | `curl -sI <BASE>/ \| grep -ci "strict-transport-security.*preload"` | `>= 1` |
| A8 | No x-powered-by leak (§269) | `curl -sI <BASE>/ \| grep -ci x-powered-by` | `= 0` |
| A9 | Rate limit 429 under burst | 15× `curl -X POST <BASE>/api/submit -H "Content-Type: text/plain" -d x`, count 429s | `>= 1` |
| A10 | Rate-limit tier header | `curl -sI -X POST <BASE>/api/submit -H "Content-Type: text/plain" -d x \| grep -i x-ratelimit-tier` | present with `upstash` or `memory` |

## B. POPIA + Regulatory

| # | Item | Proof command | Pass criteria |
|---|---|---|---|
| B1 | Consent question present | `grep -c "popia_consent" lib/questions.ts` | `>= 1` |
| B2 | Zod gates consent server-side | `grep -c "popia_consent: z.literal(true)" app/api/submit/route.ts` | `= 1` |
| B3 | UI blocks Next until ticked | `grep -c 'q.type === "consent"' components/Questionnaire.tsx` | `>= 1` |
| B4 | POPIA Act reference visible | `grep -c "Act 4 of 2013" lib/questions.ts` | `>= 1` |
| B5 | Withdrawal channel named | `grep -c "mary@zasupport.com" lib/questions.ts` | `>= 1` |

## C. Rule compliance

| # | Rule | Proof command | Pass criteria |
|---|---|---|---|
| C1 | §294 public inbound → Mary only | `grep -rc "admin@zasupport" app/ components/ \| grep -v ":0" \| wc -l` | `= 0` |
| C2 | §261 contact lock = 064 529 5863 | `grep -rc "064 529 5863" app/ components/` | `>= 1` |
| C3 | §269 no stack leaks in source | `grep -rEi "vercel\|nextjs\|next\\.js\|tailwind\|anthropic\|claude" app/ components/ --include="*.tsx" --include="*.ts" \| wc -l` | `= 0` |
| C4 | §226 no "free" sales language | `grep -rEi "free assessment\|no charge\|no obligation\|no fee" app/ components/ \| wc -l` | `= 0` |

## D. UX / Performance

| # | Item | Proof command | Pass criteria |
|---|---|---|---|
| D1 | sessionStorage autosave | `grep -c "sessionStorage" components/Questionnaire.tsx` | `>= 2` |
| D2 | useMemo on score | `grep -c "useMemo(() => calculateScore" components/Questionnaire.tsx` | `= 1` |
| D3 | Submit-button guard against double-submit | `grep -c 'submitState === "done"' components/Questionnaire.tsx` | `>= 1` |
| D4 | Focus heading on step change | `grep -c "headingRef.current.focus" components/Questionnaire.tsx` | `= 1` |

## E. Accessibility

| # | Item | Proof command | Pass criteria |
|---|---|---|---|
| E1 | role=radio on ChoiceButton | `grep -c 'role="radio"' components/ChoiceButton.tsx` | `= 1` |
| E2 | role=checkbox on multi-select | `grep -c 'role="checkbox"' components/Questionnaire.tsx` | `>= 1` |
| E3 | role=alert + aria-live on error | `grep -c 'aria-live="polite"' components/Questionnaire.tsx` | `>= 1` |
| E4 | aria-checked dynamic state | `grep -c "aria-checked" components/Questionnaire.tsx components/ChoiceButton.tsx` | `>= 2` |
| E5 | autoComplete hints on inputs | `grep -c "autoComplete" components/Questionnaire.tsx` | `>= 1` |

## F. SEO / discoverability

| # | Item | Proof command | Pass criteria |
|---|---|---|---|
| F1 | favicon.svg present | `test -s public/favicon.svg && echo ok` | `ok` |
| F2 | robots.txt allows / + references sitemap | `grep -c "Sitemap:" public/robots.txt` | `= 1` |
| F3 | sitemap.ts emits canonical URL | `test -s app/sitemap.ts && echo ok` | `ok` |
| F4 | OG + Twitter metadata populated | `grep -c "openGraph\|twitter" app/layout.tsx` | `>= 2` |
| F5 | metadataBase set | `grep -c "metadataBase" app/layout.tsx` | `= 1` |

## G. Build / deploy

| # | Item | Proof command | Pass criteria |
|---|---|---|---|
| G1 | TypeScript clean | `npx tsc --noEmit; echo $?` | `= 0` |
| G2 | `next build` clean | `npm run build; echo $?` | `= 0` |
| G3 | No turbopack workspace-root warning | `npm run build 2>&1 \| grep -c "multiple lockfiles"` | `= 0` |
| G4 | Vercel deploy READY | Vercel API `readyState` on latest production deployment | `= READY` |

---

## How this is audited

1. `~/bin/za-scout-audit.sh` — runs all checks in sequence, writes PASS:N FAIL:N WARN:N to stdout + `~/.za-scout-audit.log`
2. `~/bin/za-hcs-perfect-code.sh` Engine 3 invokes this script as a sub-check; its result becomes `Engine 3 Scout audit`
3. §282 weekly scan consults the most recent audit log for drift
4. `checklist-audit-cognitive-mode` skill mandates: never declare Scout "reviewed" without executing every row

## Extending the checklist

New item added when:
- A new rule is introduced (§NNN) and intersects Scout
- A production incident reveals a gap
- A new dependency category appears (e.g. SSR streaming, middleware, auth)

∅ add subjective rows ("looks good") — every row must reduce to a pass/fail command.

---
*Created: 24/04/2026 | Owner: Scout engineering | Governed by: checklist-audit-cognitive-mode + comprehensive-capture-hr*
