const fs = require("fs");
const path = require("path");

const inputPath = path.resolve(__dirname, "..", "docs", "documentacao-curvas-parametricas.md");
const outputDir = path.resolve(__dirname, "..", "outputs", "pdf");
const outputPath = path.join(outputDir, "documentacao-curvas-parametricas.pdf");

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_LEFT = 56;
const MARGIN_RIGHT = 56;
const MARGIN_TOP = 64;
const MARGIN_BOTTOM = 64;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

function encodePdfText(text) {
  return Buffer.from(text, "latin1").toString("binary");
}

function approximateTextWidth(text, fontSize, mono = false) {
  const factor = mono ? 0.6 : 0.52;
  return text.length * fontSize * factor;
}

function wrapText(text, fontSize, mono = false) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return [""];
  }

  const lines = [];
  let current = words[0];

  for (let index = 1; index < words.length; index += 1) {
    const candidate = `${current} ${words[index]}`;
    if (approximateTextWidth(candidate, fontSize, mono) <= CONTENT_WIDTH) {
      current = candidate;
    } else {
      lines.push(current);
      current = words[index];
    }
  }

  lines.push(current);
  return lines;
}

function parseMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let inCode = false;
  let codeLines = [];

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        codeLines = [];
      } else {
        blocks.push({ type: "code", lines: codeLines.slice() });
        inCode = false;
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
      continue;
    }

    if (!line.trim()) {
      blocks.push({ type: "spacer", size: 8 });
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push({ type: "heading1", text: line.slice(2).trim() });
      continue;
    }

    if (line.startsWith("## ")) {
      blocks.push({ type: "heading2", text: line.slice(3).trim() });
      continue;
    }

    if (line.startsWith("### ")) {
      blocks.push({ type: "heading3", text: line.slice(4).trim() });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      blocks.push({ type: "numbered", text: line.replace(/^(\d+\.)\s+/, "$1 ") });
      continue;
    }

    if (line.startsWith("- ")) {
      blocks.push({ type: "bullet", text: line.slice(2).trim() });
      continue;
    }

    blocks.push({ type: "paragraph", text: line.trim() });
  }

  return blocks;
}

function layoutBlocks(blocks) {
  const pages = [];
  let page = [];
  let cursorY = PAGE_HEIGHT - MARGIN_TOP;

  function ensureSpace(heightNeeded) {
    if (cursorY - heightNeeded < MARGIN_BOTTOM) {
      pages.push(page);
      page = [];
      cursorY = PAGE_HEIGHT - MARGIN_TOP;
    }
  }

  function addTextLine(text, font, fontSize, x, y) {
    page.push({ text, font, fontSize, x, y });
  }

  function addWrappedBlock(lines, font, fontSize, lineHeight, indent = 0) {
    const heightNeeded = lines.length * lineHeight;
    ensureSpace(heightNeeded);
    for (const line of lines) {
      addTextLine(line, font, fontSize, MARGIN_LEFT + indent, cursorY);
      cursorY -= lineHeight;
    }
  }

  for (const block of blocks) {
    if (block.type === "spacer") {
      cursorY -= block.size;
      continue;
    }

    if (block.type === "heading1") {
      const lines = wrapText(block.text, 21);
      addWrappedBlock(lines, "F2", 21, 28);
      cursorY -= 6;
      continue;
    }

    if (block.type === "heading2") {
      const lines = wrapText(block.text, 15);
      addWrappedBlock(lines, "F2", 15, 22);
      cursorY -= 4;
      continue;
    }

    if (block.type === "heading3") {
      const lines = wrapText(block.text, 12);
      addWrappedBlock(lines, "F2", 12, 18);
      cursorY -= 2;
      continue;
    }

    if (block.type === "paragraph") {
      const lines = wrapText(block.text, 11);
      addWrappedBlock(lines, "F1", 11, 16);
      cursorY -= 2;
      continue;
    }

    if (block.type === "bullet") {
      const lines = wrapText(`- ${block.text}`, 11);
      addWrappedBlock(lines, "F1", 11, 16, 8);
      cursorY -= 1;
      continue;
    }

    if (block.type === "numbered") {
      const lines = wrapText(block.text, 11);
      addWrappedBlock(lines, "F1", 11, 16, 8);
      cursorY -= 1;
      continue;
    }

    if (block.type === "code") {
      const wrappedCodeLines = [];
      block.lines.forEach((line) => {
        const chunks = wrapText(line || " ", 10, true);
        wrappedCodeLines.push(...chunks);
      });
      addWrappedBlock(wrappedCodeLines, "F3", 10, 14, 12);
      cursorY -= 4;
    }
  }

  pages.push(page);
  return pages;
}

function buildPdf(pages) {
  const objects = [];

  function addObject(content) {
    objects.push(content);
    return objects.length;
  }

  const fontRegularId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const fontBoldId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const fontMonoId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Courier /Encoding /WinAnsiEncoding >>");

  const pageObjectIds = [];

  pages.forEach((pageLines) => {
    const contentParts = [];
    pageLines.forEach((line) => {
      const safeText = line.text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
      contentParts.push(
        `BT /${line.font} ${line.fontSize} Tf 1 0 0 1 ${line.x.toFixed(2)} ${line.y.toFixed(2)} Tm (${encodePdfText(safeText)}) Tj ET`,
      );
    });

    const stream = contentParts.join("\n");
    const streamBuffer = Buffer.from(stream, "binary");
    const contentId = addObject(
      `<< /Length ${streamBuffer.length} >>\nstream\n${streamBuffer.toString("binary")}\nendstream`,
    );

    const pageId = addObject(
      `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R /F3 ${fontMonoId} 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    pageObjectIds.push(pageId);
  });

  const pagesId = addObject(
    `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`,
  );

  pageObjectIds.forEach((pageId) => {
    objects[pageId - 1] = objects[pageId - 1].replace("/Parent 0 0 R", `/Parent ${pagesId} 0 R`);
  });

  const catalogId = addObject(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  const chunks = ["%PDF-1.4\n"];
  const offsets = [0];

  objects.forEach((objectContent, index) => {
    offsets.push(Buffer.byteLength(chunks.join(""), "binary"));
    chunks.push(`${index + 1} 0 obj\n${objectContent}\nendobj\n`);
  });

  const xrefOffset = Buffer.byteLength(chunks.join(""), "binary");
  chunks.push(`xref\n0 ${objects.length + 1}\n`);
  chunks.push("0000000000 65535 f \n");

  for (let index = 1; index < offsets.length; index += 1) {
    chunks.push(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
  }

  chunks.push(
    `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`,
  );

  return Buffer.from(chunks.join(""), "binary");
}

fs.mkdirSync(outputDir, { recursive: true });

const markdown = fs.readFileSync(inputPath, "utf8");
const blocks = parseMarkdown(markdown);
const pages = layoutBlocks(blocks);
const pdfBuffer = buildPdf(pages);

fs.writeFileSync(outputPath, pdfBuffer);
console.log(`PDF generated at ${outputPath}`);
