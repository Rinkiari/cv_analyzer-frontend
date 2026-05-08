import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import {
  buildAnalysisSections,
  parseMarkdownBlocks,
  triggerDownload,
  buildAnalysisFilename,
} from './analysisExport';

// преобразуем массив runs в TextRun-ы docx, сохраняя bold/italic
function runsToTextRuns(runs) {
  return runs.map(
    (r) =>
      new TextRun({
        text: r.text,
        bold: Boolean(r.bold),
        italics: Boolean(r.italic),
      }),
  );
}

// маппинг markdown-уровня заголовка на heading docx.
// внутри секции мы и так оборачиваем её в HEADING_1, поэтому
// markdown-овский "#" опускаем на HEADING_2, и т.д.
function markdownHeadingLevel(level) {
  switch (level) {
    case 1:
      return HeadingLevel.HEADING_2;
    case 2:
      return HeadingLevel.HEADING_3;
    case 3:
      return HeadingLevel.HEADING_4;
    case 4:
      return HeadingLevel.HEADING_5;
    default:
      return HeadingLevel.HEADING_6;
  }
}

function blockToParagraph(block) {
  if (block.type === 'heading') {
    return new Paragraph({
      heading: markdownHeadingLevel(block.level),
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

export async function exportAnalysisDocx({ result, analysisId, options }) {
  const sections = buildAnalysisSections(result, options);
  if (!sections.length) {
    throw new Error('Нет данных анализа для экспорта');
  }

  const children = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: 'Анализ резюме', bold: true })],
      spacing: { after: 120 },
    }),
  );

  const dateStr = new Date().toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const subtitleParts = [dateStr];
  if (analysisId) subtitleParts.push(`ID ${String(analysisId).slice(0, 8)}`);
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: subtitleParts.join(' · '),
          italics: true,
          color: '666666',
        }),
      ],
      spacing: { after: 320 },
    }),
  );

  for (const section of sections) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun({ text: section.label, bold: true })],
        spacing: { before: 280, after: 140 },
      }),
    );
    const blocks = parseMarkdownBlocks(section.markdown);
    for (const block of blocks) {
      children.push(blockToParagraph(block));
    }
  }

  const doc = new Document({
    creator: 'ResumeIQ',
    title: 'Анализ резюме',
    description: 'Результат анализа резюме',
    styles: {
      default: {
        document: {
          run: { font: 'Calibri', size: 22 },
        },
      },
    },
    sections: [
      {
        properties: {
          page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } },
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  triggerDownload(blob, buildAnalysisFilename(analysisId, 'docx'));
}
