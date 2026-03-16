import type { Answers, ScoreResult, Recommendation } from "./types";
import { PAGES } from "./questions";

export function calculateScore(answers: Answers): ScoreResult {
  let score = 0;

  // Walk all pages and questions to accumulate risk weights
  for (const page of PAGES) {
    for (const question of page.questions) {
      const answer = answers[question.id];
      if (!answer || !question.options) continue;

      if (question.type === "single") {
        const selected = question.options.find((o) => o.value === answer);
        if (selected && selected.riskWeight !== undefined) {
          score += selected.riskWeight;
        }
      } else if (question.type === "multi" && Array.isArray(answer)) {
        for (const val of answer) {
          // Skip "none" values
          if (val === "none") continue;
          const selected = question.options.find((o) => o.value === val);
          if (selected && selected.riskWeight !== undefined) {
            score += selected.riskWeight;
          }
        }
      }
    }
  }

  // Cap at 100
  score = Math.min(score, 100);

  const level: ScoreResult["level"] =
    score <= 30
      ? "Low"
      : score <= 60
      ? "Moderate"
      : score <= 80
      ? "High"
      : "Critical";

  const colour =
    level === "Low"
      ? "#0FEA7A"
      : level === "Moderate"
      ? "#F59E0B"
      : level === "High"
      ? "#F97316"
      : "#EF4444";

  const recommendations = buildRecommendations(answers, score);

  return { score, level, colour, recommendations };
}

function buildRecommendations(answers: Answers, score: number): Recommendation[] {
  const recs: Recommendation[] = [];

  // FileVault
  if (answers.filevault_enabled === "No") {
    recs.push({
      priority: "Critical",
      title: "Enable FileVault Disk Encryption",
      body: "Your Mac's data is unprotected if the device is lost or stolen. Enable FileVault immediately via System Settings > Privacy & Security > FileVault. This is a mandatory control under POPIA for any machine storing personal data.",
    });
  } else if (answers.filevault_enabled === "Not sure") {
    recs.push({
      priority: "High",
      title: "Verify FileVault Status",
      body: "We could not confirm whether FileVault is enabled on your device. Check System Settings > Privacy & Security > FileVault and enable it if it is off.",
    });
  }

  // Backup
  if (answers.backup_status === "No backup") {
    recs.push({
      priority: "Critical",
      title: "Set Up Time Machine Immediately",
      body: "You have no backup. A single hardware failure, ransomware event, or accidental deletion could result in permanent data loss. Plug in an external drive and enable Time Machine via System Settings > General > Time Machine today.",
    });
  } else if (answers.backup_status === "External drive (manual)") {
    recs.push({
      priority: "High",
      title: "Automate Your Backup",
      body: "A manual backup is better than none but creates gaps. Enable Time Machine for continuous, automatic protection. Your most recent unsaved data is always at risk with manual-only workflows.",
    });
  }

  // Last backup age
  if (answers.last_backup === "Never" || answers.last_backup === "More than a month ago") {
    recs.push({
      priority: "High",
      title: "Run a Backup Now",
      body: "Your last backup is significantly out of date. Run a backup immediately. Any data created since your last backup is unprotected.",
    });
  }

  // Security software
  if (answers.security_software === "No") {
    recs.push({
      priority: "High",
      title: "Install Malware Protection",
      body: "Your Mac has no dedicated security software. macOS includes basic protections but does not catch all threats. Install Malwarebytes (free tier) as a minimum. CrowdStrike Falcon is recommended for business use.",
    });
  }

  // Public Wi-Fi
  if (answers.public_wifi === "Regularly") {
    recs.push({
      priority: "High",
      title: "Use a VPN on Public Wi-Fi",
      body: "You regularly use unsecured networks. Your data is visible to attackers on the same network. Enable a VPN (e.g. Cloudflare WARP or NordVPN) whenever connecting to public Wi-Fi.",
    });
  }

  // POPIA + client data gap
  const handlesClientData =
    answers.client_data === "regularly" || answers.client_data === "occasionally";
  const notCompliant =
    answers.popia_awareness === "somewhat" || answers.popia_awareness === "not aware";

  if (handlesClientData && notCompliant) {
    recs.push({
      priority: "Critical",
      title: "POPIA Compliance Gap Identified",
      body: "You handle client or patient data but have not confirmed POPIA compliance. Under the Protection of Personal Information Act (Act 4 of 2013), you are a Responsible Party and must implement appropriate safeguards. Non-compliance can result in fines up to R10 million. A ZA Support compliance audit is strongly recommended.",
    });
  }

  // IT management gap
  if (answers.it_management === "No one") {
    recs.push({
      priority: "High",
      title: "No IT Support in Place",
      body: "You have no IT support structure. Issues go unresolved, risks accumulate, and incidents are more costly without proactive management. Consider a ZA Support Health Check Scout subscription for continuous monitoring.",
    });
  }

  // Security warning ignored
  if (answers.security_warnings === "ignored") {
    recs.push({
      priority: "Critical",
      title: "Dismissed Security Warning — Immediate Review Required",
      body: "You have dismissed a macOS or browser security warning in the past. This may indicate a compromised system, rogue extension, or active threat. A full ZA Support diagnostic scan is recommended.",
    });
  }

  // Data loss history
  if (Array.isArray(answers.past_issues) && answers.past_issues.includes("data_loss")) {
    recs.push({
      priority: "High",
      title: "Previous Data Loss Event Detected",
      body: "You have experienced data loss before. Without a verified, tested backup and encryption strategy, this risk remains. Health Check Scout includes automated backup verification on every check.",
    });
  }

  // Suspected malware history
  if (Array.isArray(answers.past_issues) && answers.past_issues.includes("malware")) {
    recs.push({
      priority: "High",
      title: "Previous Malware Incident",
      body: "You have previously suspected malware or a virus on this machine. Remnants of past infections can persist. A full malware scan and system audit is recommended.",
    });
  }

  // Third-party repair
  if (answers.repair_history === "third party") {
    recs.push({
      priority: "Medium",
      title: "Third-Party Repair — Verify System Integrity",
      body: "Third-party repairs can introduce security risks including unofficial components and modified firmware. A post-repair integrity scan is recommended to confirm no unauthorised changes were made.",
    });
  }

  // Audit / insurer readiness
  if (answers.audit_required === "yes" || answers.audit_required === "possibly") {
    recs.push({
      priority: "Medium",
      title: "Prepare for Security Audit",
      body: "You may be required to demonstrate IT security controls to an insurer or auditor. Health Check Scout generates a compliant, dated audit trail of your security posture, including encryption, backup verification, and access controls.",
    });
  }

  // Always add the Scout CTA as the final item
  recs.push({
    priority: score > 60 ? "Critical" : "Medium",
    title: "Activate Health Check Scout — Continuous Protection",
    body: "Health Check Scout monitors your Mac 24/7 across 28 security, backup, and performance categories. You receive a monthly report, real-time alerts, and a dedicated IT advisor. Plans start at R 4,599/year (excl. VAT) for one doctor — no tailored quote required in most cases.",
  });

  return recs;
}
