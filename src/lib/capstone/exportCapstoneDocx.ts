/**
 * Build a Word (.docx) file from a capstone's sections and trigger a browser
 * download. Shared by the fellow's own export (blank template / draft copy)
 * and the mentor's review export, so there is a single docx-building code path.
 *
 * Runs in the browser only — `docx` is dynamically imported so it stays off
 * the server bundle and the main page-load path.
 */

export type CapstoneDocxSection = {
  label: string;
  text: string;
  /**
   * Shown in grey italics when `text` is empty (used by the fellow's template,
   * where empty sections carry a guidance prompt). Omit it to drop an empty
   * section entirely (used by the mentor export, which shouldn't show prompts).
   */
  hint?: string;
};

/** Filename-safe base from a capstone title (or any label). */
export function capstoneFilenameBase(title: string): string {
  return (title.trim() || "Capstone").replace(/[^\w\s-]/g, "").replace(/\s+/g, "_");
}

export async function downloadCapstoneDocx(input: {
  title: string;
  subtitle: string;
  sections: CapstoneDocxSection[];
  filename: string;
}): Promise<void> {
  const { Document, Packer, Paragraph, HeadingLevel, TextRun } = await import("docx");

  const renderSection = ({ label, text, hint }: CapstoneDocxSection) => {
    const filled = text.trim();
    // Empty section with no guidance prompt → omit it from the document.
    if (!filled && !hint) return [];
    return [
      new Paragraph({ text: label, heading: HeadingLevel.HEADING_2 }),
      ...(filled
        ? filled
            .split(/\n+/)
            .map((line) => new Paragraph({ children: [new TextRun(line.trim())] }))
        : [
            new Paragraph({
              children: [
                new TextRun({ text: hint as string, italics: true, color: "888888" }),
              ],
            }),
          ]),
    ];
  };

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: input.title, heading: HeadingLevel.TITLE }),
          new Paragraph({
            children: [
              new TextRun({ text: input.subtitle, italics: true, color: "666666" }),
            ],
          }),
          ...input.sections.flatMap(renderSection),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = input.filename;
  a.click();
  URL.revokeObjectURL(url);
}
