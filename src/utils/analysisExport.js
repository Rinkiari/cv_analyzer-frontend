// общие утилиты для экспорта результата анализа в DOCX и PDF.
// бэкенд возвращает result как { [categoryId]: markdownString }.
// здесь мы:
//  1) собираем непустые секции в порядке ANALYSIS_CATEGORIES,
//  2) парсим markdown в плоские блоки (heading/paragraph/bullet),
//  3) каждый блок несёт массив "runs" — отрезков с признаком bold/italic,
//     чтобы экспортёры могли сохранить инлайновое форматирование.

export function buildAnalysisSections(result, options) {
  if (!result) return [];
  return options
    .map((option) => ({
      id: option.id,
      label: option.label,
      markdown: typeof result[option.id] === 'string' ? result[option.id].trim() : '',
    }))
    .filter((section) => section.markdown.length > 0);
}

// инлайновый парсер: **жирный**, *курсив*, `код`, [текст](url) → текст.
// ничего не вкладываем — реальные ответы анализа без вложенного форматирования,
// усложнять без причины не стоит.
function parseInlineRuns(text) {
  const runs = [];
  const re = /\*\*([^*]+?)\*\*|__([^_]+?)__|\*([^*\n]+?)\*|_([^_\n]+?)_|`([^`]+?)`|\[([^\]]+)\]\([^)]+\)/g;
  let last = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      runs.push({ text: text.slice(last, m.index), bold: false, italic: false });
    }
    if (m[1] !== undefined || m[2] !== undefined) {
      runs.push({ text: m[1] ?? m[2], bold: true, italic: false });
    } else if (m[3] !== undefined || m[4] !== undefined) {
      runs.push({ text: m[3] ?? m[4], bold: false, italic: true });
    } else if (m[5] !== undefined) {
      runs.push({ text: m[5], bold: false, italic: false });
    } else if (m[6] !== undefined) {
      runs.push({ text: m[6], bold: false, italic: false });
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) {
    runs.push({ text: text.slice(last), bold: false, italic: false });
  }
  return runs.length ? runs : [{ text, bold: false, italic: false }];
}

// разбиваем markdown на блоки. Поддерживаем:
//   "# h1" .. "###### h6"            → heading
//   "- item" / "* item" / "+ item"   → bullet
//   пустая строка                    → разделитель параграфов
//   всё остальное                    → paragraph (склеиваем подряд идущие строки в один)
export function parseMarkdownBlocks(markdown) {
  const lines = String(markdown || '').replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let buffer = [];

  const flushParagraph = () => {
    if (!buffer.length) return;
    const text = buffer.join(' ').trim();
    if (text) blocks.push({ type: 'paragraph', runs: parseInlineRuns(text) });
    buffer = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      flushParagraph();
      continue;
    }
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      flushParagraph();
      blocks.push({
        type: 'heading',
        level: heading[1].length,
        runs: parseInlineRuns(heading[2]),
      });
      continue;
    }
    const bullet = /^[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      flushParagraph();
      blocks.push({ type: 'bullet', runs: parseInlineRuns(bullet[1]) });
      continue;
    }
    buffer.push(line);
  }
  flushParagraph();
  return blocks;
}

// триггер скачивания blob под заданным именем файла
export function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// единый префикс для имён файлов, чтобы экспорты письма и анализа выглядели единообразно
export function buildAnalysisFilename(analysisId, ext) {
  const id = analysisId ? String(analysisId).slice(0, 8) : 'export';
  return `analysis-${id}.${ext}`;
}
