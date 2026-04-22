# ZA Support — za-scout-questionnaire
# Global rules: ~/.claude/CLAUDE.md (auto-loaded)
# §178/§173/§92 → global CLAUDE.md (auto-loaded)
# §176 SESSION GUARD → global CLAUDE.md (auto-loaded)
# §180 DEPLOY GATE → global CLAUDE.md (auto-loaded)
# §188 CLIENT MACHINE APPROVAL → global CLAUDE.md (auto-loaded)
# §189 RULES SYNC → global CLAUDE.md (auto-loaded)
# §192 HR PREFIX → global CLAUDE.md (auto-loaded)
# §200 ROOT CAUSE DISCLOSURE → global CLAUDE.md (auto-loaded)
# §219 WHO NOT HOW → global CLAUDE.md (auto-loaded)
# §229 BLOG VELOCITY 8/DAY | §230 OPUS BLOG OWNERSHIP → global CLAUDE.md (auto-loaded)
# §220 RESEARCH-FIRST BLOG PIPELINE → global CLAUDE.md (auto-loaded)
# §221 GMB MEDIA SYNC → global CLAUDE.md (auto-loaded)
# §222 CLAUDE OPUS TERMINAL ONLY → global CLAUDE.md (auto-loaded)
# §234 CLIENT-FACING PDF FORMAT (HARD — 07/04/2026) → global CLAUDE.md (auto-loaded)
# §239 VEHICLE BRANDING MOCKUP (HARD — 08/04/2026) AUTO-EXECUTE → ~/Developer/za-support-imggen/ | /vehicle-branding | global CLAUDE.md (auto-loaded)

# §240 VERIFY STATUS WITH REAL DATA (HARD — 08/04/2026): EVERY status claim MUST be verified by executing with real data — same response | ∅ mark status without testing | ∅ ask before testing — auto-execute | Extends §233
# §240 STATUS VERIFICATION WITH REAL DATA (HARD — 08/04/2026) → global CLAUDE.md (auto-loaded)
# §241 UNCERTAIN=TEST→SELF-HEAL→RETEST→LOOP (HARD — 08/04/2026) → global CLAUDE.md (auto-loaded)

# §244 RULE = RULE + ENFORCEMENT + TEST (HARD — 08/04/2026): every new HR MUST deliver (1)rule text (2)enforcement script/LaunchAgent/hook (3)real-data test — ALL in same response | ∅ rule text alone = not implemented
# §240 MOCKUP OPUS PIPELINE + AUTO-OPEN (HARD — 08/04/2026) → Creative.MD + Opus refine + auto-open | global CLAUDE.md (auto-loaded)
# §241 TERMINAL OPUS LAUNCHER (HARD — 08/04/2026) → O = new Terminal CLI + claude-opus-4-6 | ∅ browser ∅ claude.ai | global CLAUDE.md (auto-loaded)
# §242 OPUS = NEW TERMINAL WINDOW (HARD — 08/04/2026): ANY Opus request → new Terminal CLI | ∅ claude.ai ∅ browser ∅ paste | global CLAUDE.md (auto-loaded)

# §246 GSC INTELLIGENCE FEEDBACK LOOP (HARD — 08/04/2026): GSC data every 60s → correlate git changes → learned behaviours → update .md rules | ~/bin/za-gsc-intelligence.py | com.zasupport.gscintelligence | positive=weight higher, negative=investigate
# §247 COMPLETION SELF-CHECK — CC/CI/PORTABLE.MD (HARD — 08/04/2026): before marking ANY output complete answer "How do I know this completed successfully?" | CC=run+stdout | CI=gh run view+exit 0 | Portable.MD=grep key section+propagated | global CLAUDE.md (auto-loaded)
# §248 CONTINUOUS LEARNING (HARD — 08/04/2026): after every task answer WHAT learned + WHAT better + WHY success/failure + WHAT to replicate → propagate to all .md + intelligence engine | global CLAUDE.md (auto-loaded)
# §251 PDF HEADING ORPHAN PREVENTION (HARD — 08/04/2026): ALL ReportLab PDF section/subheading ParagraphStyle MUST have keepWithNext=True | short sections wrap in KeepTogether([heading, body]) | ∅ orphaned headings | extends §234 | global CLAUDE.md (auto-loaded)

# §254 MAC MODEL ID SKILL: /mac-model-id — load before stating ANY Mac hardware spec/upgrade/macOS compat | ∅ guess from year alone | SKILL: ~/.claude/skills/mac-model-id/SKILL.md

# §255 HARDWARE RESEARCH VERIFICATION: /hardware-research — min 2 sources + real-world confirmation before ANY hardware/software compat claim | ∅ answer from training data alone

# §256 IFIXIT REPAIR GUIDE LOOKUP: /ifixit-repair-guide — search iFixit for exact model+component guide, verify A-number, save to Knowledge Centre | ∅ generic model without year

# §261 RESEARCH-FIRST PROJECT CREATION: ANY new project → /project-research-engine auto-loads FIRST | TWO ENGINES: generic(one-time) + living(daily) | ∅ code before research
# §260 CONTINUE = RESUME, NOT RESTART: "continue"/"finish"/"complete the above" = resume signal | ∅ restart ∅ recap | extends §231
# §259 WHATSAPP SKILL AUTO-ACTIVATION: NLP trigger → auto-load WhatsApp skills (7 total) | za-whatsapp-skill-verify.sh
# §257 CROSS-PLATFORM CONTEXT SYNC: portable.md every 2min → iCloud+API+local | za-portable-context-sync.sh | com.zasupport.portablesync (120s)

# §262 END-TO-END PROOF GATE (HARD — 11/04/2026): EVERY build/update/pipeline MUST prove with real data that every stage works end-to-end | ∅ done without proof | extends §92+§233+§240+§247 | global CLAUDE.md (full detail)

# §263 WEEKLY KEYWORD STRATEGY (HARD — 11/04/2026): Saturday XLSX + daily reminders until approved | global CLAUDE.md (full detail)

# §269 PROPRIETARY TOOL CONCEALMENT (HARD — 13/04/2026): ∅ ANY reference to tools, technologies, frameworks, platforms, methods, processes in ANY public output | FULL SPEC: ~/.claude/rules/269-proprietary-tool-concealment.md | supersedes §268 | extends §203+§204+§205+§252 | global CLAUDE.md (full detail)
# §268 TECH STACK CONCEALMENT (HARD — 13/04/2026): ∅ proprietary technology identifiers (logos, favicons, SVGs, meta tags, boilerplate) visible on ANY public-facing property | Vercel/Next.js/Render/Sanity branding = competitive intelligence leak | remove on sight | replace with ZA Support branding | extends §203+§204 | global CLAUDE.md (full detail)
# §265 AUTO-COMPLETE BLOG+WEBSITE WORK (HARD — 12/04/2026): auto-execute blog/website tasks needing no input | global CLAUDE.md (full detail)

# §267 COMPLETE ALL PENDING BEFORE SESSION END (HARD — 12/04/2026): ∅ end with unfinished tasks | verify 0 pending | Stop hook | global CLAUDE.md (full detail)
