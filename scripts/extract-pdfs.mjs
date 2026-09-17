import fs from "fs";
import path from "path";
import { PDFParse } from "pdf-parse";

const dir = path.join(process.cwd(), "MFin_Pages");
const outDir = path.join(process.cwd(), "lib", "mfin-content");

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const files = fs.readdirSync(dir).filter((f) => f.endsWith(".pdf")).sort();

const index = [];

for (const file of files) {
  const buffer = fs.readFileSync(path.join(dir, file));
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();
  const slug = file.replace(/\.pdf$/, "");
  const text = result.text.replace(/\s+/g, " ").trim();
  index.push({
    file,
    slug,
    pages: result.total,
    textLength: text.length,
    preview: text.slice(0, 500),
  });
  fs.writeFileSync(path.join(outDir, `${slug}.txt`), result.text, "utf8");
}

fs.writeFileSync(
  path.join(outDir, "index.json"),
  JSON.stringify(index, null, 2),
  "utf8",
);

console.log(`Extracted ${files.length} PDFs to ${outDir}`);
