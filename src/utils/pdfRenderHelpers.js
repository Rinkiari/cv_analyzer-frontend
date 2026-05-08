import RobotoRegularUrl from '../assets/fonts/Roboto-Regular.ttf?url';
import RobotoBoldUrl from '../assets/fonts/Roboto-Bold.ttf?url';

// общие хелперы для генерации PDF с кириллицей через jsPDF.
// используются и для экспорта анализа, и для письма — чтобы не дублировать
// загрузку шрифта Roboto и word-wrap логику.

let cachedFonts = null;

async function fetchAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Не удалось загрузить шрифт ${url}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

export async function loadRobotoFonts() {
  if (cachedFonts) return cachedFonts;
  const [regular, bold] = await Promise.all([
    fetchAsBase64(RobotoRegularUrl),
    fetchAsBase64(RobotoBoldUrl),
  ]);
  cachedFonts = { regular, bold };
  return cachedFonts;
}

export function registerRoboto(doc, fonts) {
  doc.addFileToVFS('Roboto-Regular.ttf', fonts.regular);
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
  doc.addFileToVFS('Roboto-Bold.ttf', fonts.bold);
  doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
  doc.setFont('Roboto', 'normal');
}

// рендер runs в указанной x,y с word-wrap'ом по maxWidth.
// каждое слово отрисовывается своим стилем (bold/normal),
// чтобы инлайн-bold из markdown не терялся.
export function renderRuns({ doc, runs, x, y, maxWidth, fontSize, ctx, color = [20, 20, 20] }) {
  const lineHeight = fontSize * 1.4;
  doc.setFontSize(fontSize);
  doc.setTextColor(color[0], color[1], color[2]);

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

  return cursorY + lineHeight;
}

// общая отрисовка одного блока markdown. Возвращает новый y.
export function renderBlock({ doc, block, x, y, maxWidth, ctx }) {
  if (block.type === 'heading') {
    const fontSize = Math.max(11, 16 - block.level * 1.5);
    y = ctx.ensureSpace(y, fontSize * 1.6);
    y = renderRuns({
      doc,
      runs: block.runs.map((r) => ({ ...r, bold: true })),
      x,
      y,
      maxWidth,
      fontSize,
      ctx,
      color: [30, 30, 30],
    });
    return y + 4;
  }
  if (block.type === 'bullet') {
    const fontSize = 11;
    y = ctx.ensureSpace(y, fontSize * 1.6);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(fontSize);
    doc.setTextColor(20, 20, 20);
    doc.text('•', x, y);
    const bulletIndent = 14;
    return renderRuns({
      doc,
      runs: block.runs,
      x: x + bulletIndent,
      y,
      maxWidth: maxWidth - bulletIndent,
      fontSize,
      ctx,
    });
  }
  // paragraph
  const fontSize = 11;
  y = ctx.ensureSpace(y, fontSize * 1.6);
  y = renderRuns({ doc, runs: block.runs, x, y, maxWidth, fontSize, ctx });
  return y + 4;
}

// добавляет нумерацию страниц в правом нижнем углу
export function addPageNumbers(doc, marginX) {
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i += 1) {
    doc.setPage(i);
    doc.setFont('Roboto', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text(`${i} / ${total}`, pageW - marginX, pageH - 24, { align: 'right' });
  }
}
