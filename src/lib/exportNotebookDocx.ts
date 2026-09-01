import {
  AlignmentType,
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { PEN_COLORS, type MarksState } from '../data/marks'
import {
  buildLessonExport,
  downloadBlob,
  fileStamp,
  lessonHasContent,
  stamp,
  type LessonExport,
  type LessonNote,
} from './exportNotebook'

function p(text: string, opts?: { italics?: boolean; size?: number; after?: number }) {
  return new Paragraph({
    spacing: { after: opts?.after ?? 120 },
    children: [
      new TextRun({
        text,
        italics: opts?.italics,
        size: opts?.size ?? 22,
        font: 'Arial',
      }),
    ],
  })
}

function heading(text: string, level: typeof HeadingLevel.HEADING_1 | typeof HeadingLevel.HEADING_2) {
  return new Paragraph({
    heading: level,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, font: 'Arial' })],
  })
}

function cite(ref: string, url: string) {
  return new Paragraph({
    spacing: { before: 160, after: 80 },
    children: [
      new ExternalHyperlink({
        link: url,
        children: [new TextRun({ text: ref, style: 'Hyperlink', bold: true, font: 'Arial', size: 22 })],
      }),
    ],
  })
}

function noteParagraphs(n: LessonNote) {
  const out = [cite(n.ref, n.url)]
  if (n.verseText) out.push(p(n.verseText, { size: 24, after: 80 }))
  if (n.phrase) out.push(p(`Marked: “${n.phrase}”`, { italics: true }))
  if (n.text) out.push(p(`My note: ${n.text}`))
  return out
}

export async function lessonToDocx(lesson: LessonExport) {
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.LEFT,
      spacing: { after: 120 },
      children: [new TextRun({ text: 'Walking By Faith — Notebook', font: 'Arial' })],
    }),
    p(`Exported ${stamp()}`, { italics: true, size: 20, after: 240 }),
  ]

  if (lesson.notesBySubject.length || lesson.unsortedNotes.length) {
    children.push(heading('Notes', HeadingLevel.HEADING_1))
    for (const group of lesson.notesBySubject) {
      children.push(heading(group.subject, HeadingLevel.HEADING_2))
      for (const n of group.notes) children.push(...noteParagraphs(n))
    }
    if (lesson.unsortedNotes.length) {
      children.push(heading('Notes without a subject', HeadingLevel.HEADING_2))
      for (const n of lesson.unsortedNotes) children.push(...noteParagraphs(n))
    }
  }

  if (lesson.highlights.length) {
    children.push(heading('Highlights', HeadingLevel.HEADING_1))
    for (const color of PEN_COLORS) {
      const rows = lesson.highlights.filter((h) => h.color === color.id)
      if (!rows.length) continue
      children.push(heading(rows[0].pen, HeadingLevel.HEADING_2))
      for (const h of rows) {
        children.push(cite(h.ref, h.url))
        if (h.verseText) children.push(p(h.verseText, { size: 24, after: 80 }))
        children.push(p(`Highlighted: “${h.phrase}”`, { italics: true }))
      }
    }
  }

  if (lesson.bookmarks.length) {
    children.push(heading('Bookmarks', HeadingLevel.HEADING_1))
    for (const b of lesson.bookmarks) {
      children.push(cite(b.ref, b.url))
      if (b.verseText) children.push(p(b.verseText, { size: 24 }))
    }
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Arial', size: 22 } } },
      paragraphStyles: [
        {
          id: 'Title',
          name: 'Title',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 36, bold: true, font: 'Arial', color: '2F3E4A' },
          paragraph: { spacing: { before: 0, after: 120 }, outlineLevel: 0 },
        },
        {
          id: 'Heading1',
          name: 'Heading 1',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 28, bold: true, font: 'Arial', color: '2F3E4A' },
          paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2',
          name: 'Heading 2',
          basedOn: 'Normal',
          next: 'Normal',
          quickFormat: true,
          run: { size: 24, bold: true, font: 'Arial', color: '2F3E4A' },
          paragraph: { spacing: { before: 220, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
          },
        },
        children,
      },
    ],
  })
  return Packer.toBlob(doc)
}

export async function downloadLessonWord(marks: MarksState) {
  const lesson = buildLessonExport(marks)
  if (!lessonHasContent(lesson)) return false
  const blob = await lessonToDocx(lesson)
  downloadBlob(blob, `walking-by-faith-notebook-${fileStamp()}.docx`)
  return true
}
