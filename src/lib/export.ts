import jsPDF from 'jspdf';
import type { Session, WeeklyPlan } from '../types';

// ── Markdown ──────────────────────────────────────────────────────────────────

function sessionToMarkdown(session: Session): string {
  const lines: string[] = [
    `# ${session.day}: ${session.focus}`,
    `**Energy System:** ${session.energySystem}  |  **Total Volume:** ${session.totalVolumeM}m`,
    `*Generated: ${new Date(session.createdAt).toLocaleDateString()}*`,
    '',
  ];

  if (session.specialRequests) {
    lines.push(`> Special requests: ${session.specialRequests}`, '');
  }

  for (const set of session.sets) {
    lines.push(`## ${set.name}`);
    lines.push(set.description);
    lines.push('');

    const meta: string[] = [];
    if (set.effort) meta.push(`**Effort:** ${set.effort}`);
    if (set.rest) meta.push(`**Rest:** ${set.rest}`);
    if (set.equipment) meta.push(`**Equipment:** ${set.equipment}`);
    if (meta.length) lines.push(meta.join('  |  '), '');

    if (set.techniqueCue) {
      lines.push(`> **Technique:** ${set.techniqueCue}`, '');
    }
  }

  return lines.join('\n');
}

function weeklyPlanToMarkdown(plan: WeeklyPlan): string {
  const lines: string[] = [
    `# ${plan.phase} Training Week`,
    `*Generated: ${new Date(plan.createdAt).toLocaleDateString()}*`,
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
  const filename = `swim-session-${session.day.toLowerCase()}-${session.focus.replace(/\//g, '-').replace(/\s+/g, '-')}.md`;
  triggerDownload(md, filename, 'text/markdown');
}

export function exportWeeklyMarkdown(plan: WeeklyPlan): void {
  const md = weeklyPlanToMarkdown(plan);
  triggerDownload(md, `swim-week-${plan.phase.toLowerCase()}.md`, 'text/markdown');
}

// ── PDF ───────────────────────────────────────────────────────────────────────

const MARGIN = 15;
const LINE_HEIGHT = 6;
const PAGE_WIDTH = 210; // A4

function addWrappedText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineH = LINE_HEIGHT,
): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineH;
}

function ensureSpace(doc: jsPDF, y: number, needed = 20): number {
  if (y + needed > 280) {
    doc.addPage();
    return MARGIN + 5;
  }
  return y;
}

function sessionToPDF(doc: jsPDF, session: Session, startY = MARGIN): number {
  let y = startY;
  const textWidth = PAGE_WIDTH - MARGIN * 2;

  // Title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  y = addWrappedText(doc, `${session.day}: ${session.focus}`, MARGIN, y, textWidth);
  y += 2;

  // Meta
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Energy: ${session.energySystem}  |  Volume: ${session.totalVolumeM}m`,
    MARGIN,
    y,
  );
  y += LINE_HEIGHT + 2;

  for (const set of session.sets) {
    y = ensureSpace(doc, y);

    // Set name
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(set.name, MARGIN, y);
    y += LINE_HEIGHT;

    // Description
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    y = addWrappedText(doc, set.description, MARGIN, y, textWidth);
    y += 2;

    // Meta line
    const parts: string[] = [];
    if (set.effort) parts.push(`Effort: ${set.effort}`);
    if (set.rest) parts.push(`Rest: ${set.rest}`);
    if (set.equipment) parts.push(`Equipment: ${set.equipment}`);
    if (parts.length) {
      doc.setTextColor(80, 80, 80);
      y = addWrappedText(doc, parts.join('  |  '), MARGIN, y, textWidth, 5);
      doc.setTextColor(0, 0, 0);
      y += 2;
    }

    // Technique cue
    if (set.techniqueCue) {
      y = ensureSpace(doc, y);
      doc.setTextColor(30, 100, 180);
      y = addWrappedText(doc, `Technique: ${set.techniqueCue}`, MARGIN + 4, y, textWidth - 4, 5);
      doc.setTextColor(0, 0, 0);
      y += 2;
    }

    y += 4;
  }

  return y;
}

export function exportSessionPDF(session: Session): void {
  const doc = new jsPDF();
  sessionToPDF(doc, session, MARGIN + 5);
  doc.save(`swim-session-${session.day.toLowerCase()}.pdf`);
}

export function exportWeeklyPDF(plan: WeeklyPlan): void {
  const doc = new jsPDF();

  // Cover page title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(`${plan.phase} Training Week`, MARGIN, MARGIN + 5);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date(plan.createdAt).toLocaleDateString()}`, MARGIN, MARGIN + 12);

  let y = MARGIN + 22;

  for (let i = 0; i < plan.sessions.length; i++) {
    if (i > 0) {
      doc.addPage();
      y = MARGIN + 5;
    }
    y = sessionToPDF(doc, plan.sessions[i]!, y);
  }

  doc.save(`swim-week-${plan.phase.toLowerCase()}.pdf`);
}
