import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import {
  parseMarkdownBlocks,
  triggerDownload,
  buildLetterFilename,
} from './analysisExport';
import { blockToParagraph } from './docxRenderHelpers';

export async function exportLetterDocx({ letterText, analysisId }) {
  const text = String(letterText || '').trim();
  if (!text) throw new Error('Нет текста письма для экспорта');

  const children = [];

  children.push(
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text: 'Сопроводительное письмо', bold: true })],
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

  const blocks = parseMarkdownBlocks(text);
  for (const block of blocks) {
    // у письма нет обёртки-секции, так что markdown "#" остаётся HEADING_1
    children.push(blockToParagraph(block, { headingOffset: 0 }));
  }

  const doc = new Document({
    creator: 'ResumeIQ',
    title: 'Сопроводительное письмо',
    description: 'Сопроводительное письмо',
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
  triggerDownload(blob, buildLetterFilename(analysisId, 'docx'));
}
