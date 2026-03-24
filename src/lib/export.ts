import jsPDF from 'jspdf';
import type { Session, WeeklyPlan } from '../types';

// ── Markdown ──────────────────────────────────────────────────────────────────

function sessionToMarkdown(session: Session): string {
  const lines: string[] = [
    `# ${session.day}: ${session.focus}`,
    `\`${session.energySystem}\` · **${session.totalVolumeM}m**`,
    `*${new Date(session.createdAt).toLocaleDateString()}*`,
    '',
  ];

  if (session.specialRequests) {
    lines.push(`> ${session.specialRequests}`, '');
  }

  // Table header
  lines.push('| Set | Description | Effort | Rest | Vol |');
  lines.push('|-----|-------------|--------|------|-----|');

  for (const set of session.sets) {
    const effort = set.effort ?? '—';
    const rest = set.rest ?? '—';
    const vol = set.volumeM > 0 ? `${set.volumeM}m` : '—';
    const desc = set.description.replace(/\|/g, '\\|');
    lines.push(`| **${set.name}** | ${desc} | ${effort} | ${rest} | ${vol} |`);
    if (set.techniqueCue) {
      lines.push(`| | *› ${set.techniqueCue.replace(/\|/g, '\\|')}* | | | |`);
    }
    if (set.equipment) {
      lines.push(`| | \`${set.equipment}\` | | | |`);
    }
  }

  return lines.join('\n');
}

function weeklyPlanToMarkdown(plan: WeeklyPlan): string {
  const lines: string[] = [
    `# ${plan.phase} Training Week`,
    `*${new Date(plan.createdAt).toLocaleDateString()}*`,
  ];

  if (plan.context) lines.push(`> ${plan.context}`);
  lines.push('');

  for (const session of plan.sessions) {
    lines.push(sessionToMarkdown(session), '', '---', '');
  }

  return lines.join('\n');
}

function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportSessionMarkdown(session: Session): void {
  const md = sessionToMarkdown(session);
  const filename = `swim-${session.day.toLowerCase()}-${session.focus.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase()}.md`;
  triggerDownload(md, filename, 'text/markdown');
}

export function exportWeeklyMarkdown(plan: WeeklyPlan): void {
  const md = weeklyPlanToMarkdown(plan);
  triggerDownload(md, `swim-week-${plan.phase.toLowerCase()}.md`, 'text/markdown');
}

// ── PDF — compact workout sheet ───────────────────────────────────────────────

const M = 14;          // margin
const PW = 210;        // page width (A4)
const CW = PW - M * 2; // content width
const LH = 5.5;        // base line height

function wrap(doc: jsPDF, text: string, x: number, y: number, maxW: number, lh = LH): number {
  const lines = doc.splitTextToSize(text, maxW) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lh;
}

function newPageIfNeeded(doc: jsPDF, y: number, needed = 18): number {
  if (y + needed > 282) {
    doc.addPage();
    return M + 4;
  }
  return y;
}

// Draw a thin horizontal rule
function rule(doc: jsPDF, y: number, alpha = 0.15): void {
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.2);
  doc.line(M, y, PW - M, y);
  doc.setDrawColor(0, 0, 0);
  void alpha; // alpha not used (jsPDF doesn't support line alpha easily)
}

function sessionToPDF(doc: jsPDF, session: Session, startY = M): number {
  let y = startY;

  // ── Session header ──────────────────────────────────────────────────────────
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(130, 130, 130);
  doc.text(
    `${session.day.toUpperCase()}  ·  ${session.energySystem.toUpperCase()}  ·  ${new Date(session.createdAt).toLocaleDateString()}`,
    M, y,
  );
  y += 6;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(20, 20, 20);
  y = wrap(doc, session.focus, M, y, CW * 0.7, 7);

  // Volume — large mono number on the right
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  const volStr = `${session.totalVolumeM.toLocaleString()}m`;
  const volW = doc.getTextWidth(volStr);
  doc.text(volStr, PW - M - volW, startY + 13);

  y += 2;
  rule(doc, y);
  y += 5;

  // ── Column headers ──────────────────────────────────────────────────────────
  const COL = { name: M, desc: M + 28, effort: M + 118, rest: M + 142, vol: M + 166 };

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(160, 160, 160);
  doc.text('SET', COL.name, y);
  doc.text('DESCRIPTION', COL.desc, y);
  doc.text('EFFORT', COL.effort, y);
  doc.text('REST', COL.rest, y);
  doc.text('VOL', COL.vol, y);
  y += 4;
  rule(doc, y);
  y += 5;

  // ── Set rows ────────────────────────────────────────────────────────────────
  for (const set of session.sets) {
    y = newPageIfNeeded(doc, y, 14);

    // Set name
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    const nameLines = doc.splitTextToSize(set.name.toUpperCase(), 26) as string[];
    doc.text(nameLines, COL.name, y);

    // Description
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 30, 30);
    const descLines = doc.splitTextToSize(set.description, 86) as string[];
    doc.text(descLines, COL.desc, y);

    // Effort
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(70, 70, 70);
    if (set.effort) doc.text(set.effort, COL.effort, y);

    // Rest
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    if (set.rest) {
      const restLines = doc.splitTextToSize(set.rest, 22) as string[];
      doc.text(restLines, COL.rest, y);
    }

    // Volume
    doc.setFont('helvetica', 'normal');
    if (set.volumeM > 0) doc.text(`${set.volumeM}m`, COL.vol, y);

    const rowH = Math.max(nameLines.length, descLines.length) * LH;
    y += rowH;

    // Equipment
    if (set.equipment) {
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(`⚙ ${set.equipment}`, COL.desc, y);
      y += 4;
    }

    // Technique cue
    if (set.techniqueCue) {
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(120, 120, 120);
      y = wrap(doc, `› ${set.techniqueCue}`, COL.desc, y, CW - 30, 4.5);
      y += 1;
    }

    y += 2;
    rule(doc, y, 0.08);
    y += 4;
  }

  return y;
}

export function exportSessionPDF(session: Session): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  sessionToPDF(doc, session, M + 8);
  const filename = `swim-${session.day.toLowerCase()}-${session.focus.replace(/\//g, '-').replace(/\s+/g, '-').toLowerCase()}.pdf`;
  doc.save(filename);
}

export function exportWeeklyPDF(plan: WeeklyPlan): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Cover header
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text(
    `SWIMCOACH AI  ·  ${plan.phase} TRAINING WEEK  ·  ${new Date(plan.createdAt).toLocaleDateString()}`,
    M, M + 4,
  );

  const totalVol = plan.sessions.reduce((s, d) => s + d.totalVolumeM, 0);
  doc.setFontSize(7);
  doc.setTextColor(180, 180, 180);
  doc.text(`Total: ${totalVol.toLocaleString()}m`, M, M + 9);

  let y = M + 18;

  for (let i = 0; i < plan.sessions.length; i++) {
    if (i > 0) {
      doc.addPage();
      y = M + 8;
    }
    y = sessionToPDF(doc, plan.sessions[i]!, y);
  }

  doc.save(`swim-week-${plan.phase.toLowerCase()}.pdf`);
}
