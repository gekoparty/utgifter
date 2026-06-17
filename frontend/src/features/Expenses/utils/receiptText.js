const MAX_TEXT_LENGTH = 80000;

const cleanExtractedText = (value) =>
  String(value ?? "")
    .replace(/\0/g, " ")
    .replace(/[^\S\r\n]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_TEXT_LENGTH);

const readFileAsText = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });

const readFileAsArrayBuffer = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });

const decodeBytes = (buffer) => {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 8192;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.slice(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return binary;
};

const extractPdfStrings = (rawPdfText) => {
  const strings = [];
  const literalStringPattern = /\(([^()]{2,160})\)/g;
  let match;

  while ((match = literalStringPattern.exec(rawPdfText))) {
    const value = match[1]
      .replace(/\\([()\\])/g, "$1")
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\n")
      .trim();

    if (/[a-zæøå0-9]/i.test(value)) strings.push(value);
    if (strings.join("\n").length > MAX_TEXT_LENGTH) break;
  }

  return strings.join("\n");
};

const isImageFile = (file, type, name) =>
  type.startsWith("image/") ||
  /\.(png|jpe?g|webp|bmp|gif|tiff?)$/i.test(name);

const extractImageTextWithOcr = async (file, onProgress) => {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("nor+eng", undefined, {
    logger: (event) => {
      if (!event || typeof onProgress !== "function") return;

      const progress = Number(event.progress);
      onProgress({
        status: event.status || "ocr",
        progress: Number.isFinite(progress) ? progress : 0,
      });
    },
  });

  try {
    const result = await worker.recognize(file);
    return cleanExtractedText(result?.data?.text || "");
  } finally {
    await worker.terminate();
  }
};

export const extractReceiptTextFromFile = async (file, options = {}) => {
  if (!file) return "";

  const { onProgress } = options;
  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();

  if (type.includes("text") || name.endsWith(".txt") || name.endsWith(".csv")) {
    return cleanExtractedText(await readFileAsText(file));
  }

  if (type.includes("pdf") || name.endsWith(".pdf")) {
    const buffer = await readFileAsArrayBuffer(file);
    return cleanExtractedText(extractPdfStrings(decodeBytes(buffer)));
  }

  if (isImageFile(file, type, name)) {
    return extractImageTextWithOcr(file, onProgress);
  }

  return "";
};
