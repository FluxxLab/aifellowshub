/**
 * Client-side capstone document parser.
 *
 * When a fellow uploads their capstone document we try to read its contents
 * back into the on-screen boxes so they don't have to re-type what they
 * already wrote in the file. Parsing runs entirely in the browser — the file
 * is never round-tripped to a server for this — and is strictly best-effort:
 * callers must treat a throw or an empty result as "couldn't import" and carry
 * on, never blocking the upload itself.
 *
 * `.docx` (from our downloadable template) is reliable: the template writes
 * four fixed `Heading 2` sections that map one-to-one to the form fields, so
 * mammoth's HTML output gives us clean `<h2>` anchors to split on. A free-form
 * `.docx` whose headings don't match simply yields fewer matched sections.
 *
 * PDF has no dependable heading structure, so we only extract the full text
 * (via pdf.js) and hand it back as `rawText` for the caller to drop into a
 * single box — we don't guess at section boundaries.
 */

export type ParsedCapstoneFields = {
  title?: string;
  problem?: string;
  approach?: string;
  deliverables?: string;
  risks?: string;
};

export type ParsedCapstone = {
  /** Sections we recognised and mapped (docx only; empty for PDF). */
  fields: ParsedCapstoneFields;
  /** Full extracted text — the fallback when sections can't be mapped. */
  rawText: string;
  /** How many of the four body sections were recognised (0–4). */
  matchedSections: number;
  /**
   * `docx` / `pdf` parsed normally. `unsupported` = a format we can't read in
   * the browser (legacy binary `.doc` — mammoth only handles the zip-based
   * `.docx`), so the caller should tell the fellow to re-save as `.docx`.
   */
  source: "docx" | "pdf" | "unsupported";
};

type SectionKey = "problem" | "approach" | "deliverables" | "risks";

/**
 * Normalise a heading for matching: lowercase, collapse whitespace, and drop
 * anything that isn't a letter or space (so "Risks & limitations",
 * "Risks and limitations", and "RISKS &  LIMITATIONS." all match).
 */
function normalizeHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Map a normalised heading to a body field, or null if it isn't one of ours. */
function headingToKey(normalized: string): SectionKey | null {
  if (normalized.startsWith("problem statement") || normalized === "problem")
    return "problem";
  if (normalized.startsWith("approach")) return "approach";
  if (normalized.startsWith("deliverable")) return "deliverables";
  if (normalized.startsWith("risk")) return "risks";
  return null;
}

/**
 * The italic guidance prompts the template prints under each empty heading.
 * If a fellow leaves them in place we must not import them as their own text,
 * so any line that exactly matches one is stripped from the parsed section.
 */
const GUIDANCE_PROMPTS = new Set(
  [
    "What is the harm or governance gap, and why does it matter?",
    "How will you address it? Method, framework, deliverable type.",
    "Concrete artefacts — what will exist by Week 12?",
    "What could go wrong, and what's out of scope.",
  ].map((s) => s.trim()),
);

function cleanSectionText(lines: string[]): string {
  return lines
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !GUIDANCE_PROMPTS.has(l))
    .join("\n")
    .trim();
}

/**
 * Parse a `.docx` into mapped sections. Uses mammoth to render the document to
 * HTML (Word "Heading 2" → `<h2>`, "Title" → `<h1>` via the style map), then
 * walks the block elements in order, bucketing each paragraph under the most
 * recent recognised heading.
 */
async function parseDocx(file: File): Promise<ParsedCapstone> {
  // Dynamic import keeps mammoth out of the server bundle (it must only run in
  // the browser) and off the main page-load path. mammoth is CommonJS, so the
  // interop shape differs by bundler — the callable object may be on `.default`
  // or be the namespace itself; accept either so a browser build can't silently
  // land on `undefined.convertToHtml`.
  const mammothMod = await import("mammoth");
  const mammoth =
    (mammothMod as unknown as { default?: typeof mammothMod }).default ??
    mammothMod;
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml(
    { arrayBuffer },
    { styleMap: ["p[style-name='Title'] => h1:fresh"] },
  );

  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks = Array.from(doc.body.children);

  const fields: ParsedCapstoneFields = {};
  let current: SectionKey | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (current) {
      const text = cleanSectionText(buffer);
      if (text) fields[current] = text;
    }
    buffer = [];
  };

  for (const el of blocks) {
    const tag = el.tagName.toLowerCase();
    const text = (el.textContent ?? "").trim();
    if (tag === "h1") {
      // Document title — only take the first, and ignore the template's own
      // "<sector> · Capstone template" subtitle line.
      if (!fields.title && text && !/capstone template|draft exported/i.test(text)) {
        fields.title = text;
      }
      continue;
    }
    if (tag === "h2" || tag === "h3") {
      flush();
      current = headingToKey(normalizeHeading(text));
      continue;
    }
    if (current && text) buffer.push(text);
  }
  flush();

  const matchedSections = (["problem", "approach", "deliverables", "risks"] as const).filter(
    (k) => fields[k],
  ).length;

  return {
    fields,
    rawText: (doc.body.textContent ?? "").replace(/\n{3,}/g, "\n\n").trim(),
    matchedSections,
    source: "docx",
  };
}

/** Extract all text from a PDF, page by page. No section mapping. */
async function parsePdf(file: File): Promise<ParsedCapstone> {
  // Legacy build (transpiled — no top-level await / Promise.withResolvers that
  // break the Next 14 webpack build). The worker is vendored to /public and
  // pinned to this exact pdfjs version, so it's same-origin (satisfies CSP
  // `worker-src 'self'`) and can never drift from the API version.
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    parts.push(
      content.items
        .map((it) => ("str" in it ? (it as { str: string }).str : ""))
        .join(" "),
    );
  }
  await pdf.destroy();

  return {
    fields: {},
    rawText: parts.join("\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim(),
    matchedSections: 0,
    source: "pdf",
  };
}

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/**
 * Parse an uploaded capstone document into whatever structure we can recover.
 * Dispatches on MIME type; `.doc` (legacy binary Word) isn't supported by
 * mammoth and returns an empty result rather than throwing.
 */
export async function parseCapstoneDocument(file: File): Promise<ParsedCapstone> {
  if (file.type === DOCX_MIME) return parseDocx(file);
  if (file.type === "application/pdf") return parsePdf(file);
  // Legacy binary `.doc` (application/msword) or anything else — mammoth only
  // reads the zip-based `.docx`, so flag it so the caller can advise re-saving.
  return { fields: {}, rawText: "", matchedSections: 0, source: "unsupported" };
}
