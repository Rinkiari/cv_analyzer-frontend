import { jsPDF } from 'jspdf';
import {
  parseMarkdownBlocks,
  triggerDownload,
  buildLetterFilename,
} from './analysisExport';
import {
  loadRobotoFonts,
  registerRoboto,
  renderBlock,
  addPageNumbers,
} from './pdfRenderHelpers';

export async function exportLetterPdf({ letterText, analysisId }) {
  const text = String(letterText || '').trim();
  if (!text) throw new Error('Нет текста письма для экспорта');

  const fonts = await loadRobotoFonts();
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  registerRoboto(doc, fonts);

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const marginX = 48;
  const marginY = 56;
  const contentW = pageW - marginX * 2;

  let y = marginY;

  const ensureSpace = (proposedY, lineHeight) => {
    if (proposedY + lineHeight > pageH - marginY) {
      doc.addPage();
      registerRoboto(doc, fonts);
      return marginY + lineHeight;
    }
    return proposedY;
  };
  const ctx = { ensureSpace };

  // Заголовок
  y = ensureSpace(y, 28);
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text('Сопроводительное письмо', marginX, y);
  y += 28;

  const dateStr = new Date().toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const subtitle = analysisId
    ? `${dateStr} · ID ${String(analysisId).slice(0, 8)}`
    : dateStr;
  doc.setFont('Roboto', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text(subtitle, marginX, y);
  y += 26;

  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, marginX + contentW, y);
  y += 22;

  const blocks = parseMarkdownBlocks(text);
  for (const block of blocks) {
    y = renderBlock({ doc, block, x: marginX, y, maxWidth: contentW, ctx });
  }

  addPageNumbers(doc, marginX);
  triggerDownload(doc.output('blob'), buildLetterFilename(analysisId, 'pdf'));
}
