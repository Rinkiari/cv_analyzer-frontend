import { jsPDF } from 'jspdf';
import RobotoRegularUrl from '../assets/fonts/Roboto-Regular.ttf?url';
import RobotoBoldUrl from '../assets/fonts/Roboto-Bold.ttf?url';
import {
  buildAnalysisSections,
  parseMarkdownBlocks,
  triggerDownload,
  buildAnalysisFilename,
} from './analysisExport';

// jsPDF без кастомного шрифта рисует кириллицу как квадратики:
// встроенные Helvetica/Times — Latin-1 only. Подкладываем Roboto
// (subset cyrillic+latin), регистрируем в виртуальной FS pdfDocument-а
// и переключаемся на него до первого text() — иначе позиции байтов уедут.

let cachedFonts = null;

async function fetchAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не удалось загрузить шрифт ${url}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  // String.fromCharCode(...bytes) на длинных файлах валит стек,
  // поэтому собираем кусками
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

async function loadFonts() {
  if (cachedFonts) return cachedFonts;
  const [regular, bold] = await Promise.all([
    fetchAsBase64(RobotoRegularUrl),
    fetchAsBase64(RobotoBoldUrl),
  ]);
  cachedFonts = { regular, bold };
  return cachedFonts;
}

function registerRoboto(doc, fonts) {
  doc.addFileToVFS('Roboto-Regular.ttf', fonts.regular);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', fonts.bold);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto', 'normal');
}

// рендер runs в указанной x,y с word-wrap'ом по maxWidth.
// каждое слово отрисовывается своим стилем (bold/normal),
// чтобы инлайн-bold из markdown не терялся — иначе пришлось бы
// делать второй проход и склеивать всё в plain text.
function renderRuns({ doc, runs, x, y, maxWidth, fontSize, ctx, color = [20, 20, 20] }) {
  const lineHeight = fontSize * 1.4;
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);

  // токенизируем в слова с признаком стиля
  const tokens = [];
  for (const run of runs) {
    const words = (run.text || '').match(/\S+/g) || [];
    for (const word of words) tokens.push({ word, bold: !!run.bold });
  }

  let cursorX = x;
  let cursorY = y;
  const lineStart = x;

  for (const t of tokens) {
    doc.setFont('Roboto', t.bold ? 'bold' : 'normal');
    const isFirstOnLine = cursorX === lineStart;
    const piece = isFirstOnLine ? t.word : ` ${t.word}`;
    const pieceWidth = doc.getTextWidth(piece);

    if (!isFirstOnLine && cursorX + pieceWidth > lineStart + maxWidth) {
      // перенос на новую строку
      cursorX = lineStart;
      cursorY += lineHeight;
      cursorY = ctx.ensureSpace(cursorY, lineHeight);
      const wordWidth = doc.getTextWidth(t.word);
      doc.text(t.word, cursorX, cursorY);
      cursorX += wordWidth;
    } else {
      doc.text(piece, cursorX, cursorY);
      cursorX += pieceWidth;
    }
  }

  // сдвигаем y под последнюю строку
  return cursorY + lineHeight;
}

export async function exportAnalysisPdf({ result, analysisId, options }) {
  const sections = buildAnalysisSections(result, options);
  if (!sections.length) {
    throw new Error('Нет данных анализа для экспорта');
  }

  const fonts = await loadFonts();
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
      registerRoboto(doc, fonts); // на новой странице нужно зафиксировать шрифт ещё раз
      return marginY + lineHeight;
    }
    return proposedY;
  };
  const ctx = { ensureSpace };

  // Заголовок документа
  y = ensureSpace(y, 28);
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text('Анализ резюме', marginX, y);
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

  // Разделительная линия
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.line(marginX, y, marginX + contentW, y);
  y += 22;

  for (const section of sections) {
    // Заголовок секции
    y = ensureSpace(y, 24);
    doc.setFont('Roboto', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(section.label, marginX, y);
    y += 22;

    const blocks = parseMarkdownBlocks(section.markdown);
    for (const block of blocks) {
      if (block.type === 'heading') {
        const fontSize = Math.max(11, 16 - block.level * 1.5);
        y = ensureSpace(y, fontSize * 1.6);
        y = renderRuns({
          doc,
          runs: block.runs.map((r) => ({ ...r, bold: true })),
          x: marginX,
          y,
          maxWidth: contentW,
          fontSize,
          ctx,
          color: [30, 30, 30],
        });
        y += 4;
      } else if (block.type === 'bullet') {
        const fontSize = 11;
        y = ensureSpace(y, fontSize * 1.6);
        doc.setFont('Roboto', 'normal');
        doc.setFontSize(fontSize);
        doc.setTextColor(20, 20, 20);
        doc.text('•', marginX, y);
        const bulletIndent = 14;
        y = renderRuns({
          doc,
          runs: block.runs,
          x: marginX + bulletIndent,
          y,
          maxWidth: contentW - bulletIndent,
          fontSize,
          ctx,
        });
      } else {
        const fontSize = 11;
        y = ensureSpace(y, fontSize * 1.6);
        y = renderRuns({
          doc,
          runs: block.runs,
          x: marginX,
          y,
          maxWidth: contentW,
          fontSize,
          ctx,
        });
        y += 4;
      }
    }

    y += 14;
  }

  // Нумерация страниц
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i += 1) {
    doc.setPage(i);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text(`${i} / ${totalPages}`, pageW - marginX, pageH - 24, { align: 'right' });
  }

  triggerDownload(doc.output('blob'), buildAnalysisFilename(analysisId, 'pdf'));
}
