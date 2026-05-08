import { Paragraph, TextRun, HeadingLevel } from 'docx';

// общие хелперы для генерации DOCX из распарсенного markdown.
// используются и для экспорта анализа, и для письма.

export function runsToTextRuns(runs) {
  return runs.map(
    (r) =>
      new TextRun({
        text: r.text,
        bold: Boolean(r.bold),
        italics: Boolean(r.italic),
      }),
  );
}

// markdown-овский "#" в анализе мы оборачиваем внутри секции (HEADING_1),
// поэтому передаём headingOffset, чтобы "#" опустился на HEADING_2.
// для письма (без обёртки секции) headingOffset = 0 и "#" остаётся HEADING_1.
function markdownHeadingLevel(level, offset) {
  const target = Math.min(6, level + offset);
  switch (target) {
    case 1:
      return HeadingLevel.HEADING_1;
    case 2:
      return HeadingLevel.HEADING_2;
    case 3:
      return HeadingLevel.HEADING_3;
    case 4:
      return HeadingLevel.HEADING_4;
    case 5:
      return HeadingLevel.HEADING_5;
    default:
      return HeadingLevel.HEADING_6;
  }
}

export function blockToParagraph(block, { headingOffset = 0 } = {}) {
  if (block.type === 'heading') {
    return new Paragraph({
      heading: markdownHeadingLevel(block.level, headingOffset),
      children: runsToTextRuns(block.runs),
      spacing: { before: 200, after: 100 },
    });
  }
  if (block.type === 'bullet') {
    return new Paragraph({
      bullet: { level: 0 },
      children: runsToTextRuns(block.runs),
      spacing: { after: 60 },
    });
  }
  return new Paragraph({
    children: runsToTextRuns(block.runs),
    spacing: { after: 100 },
  });
}
