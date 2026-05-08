import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import {
  buildAnalysisSections,
  parseMarkdownBlocks,
  triggerDownload,
  buildAnalysisFilename,
} from './analysisExport';
import { blockToParagraph } from './docxRenderHelpers';

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
      // headingOffset=1 — markdown "#" внутри секции опускаем на HEADING_2,
      // чтобы не конкурировал с названием секции
      children.push(blockToParagraph(block, { headingOffset: 1 }));
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
