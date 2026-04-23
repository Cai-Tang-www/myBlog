export type ImageProvider = "qiniu" | "volc" | "none";

const imageProvider = (process.env.NEXT_PUBLIC_IMAGE_PROVIDER ??
  "none") as ImageProvider;
const imageBaseUrl = (process.env.NEXT_PUBLIC_IMAGE_BASE_URL ?? "").replace(
  /\/+$/,
  ""
);

interface ImageBuildOptions {
  width?: number;
  quality?: number;
}

function isHttpUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function normalizePath(value: string): string {
  return value.replace(/^\/+/, "");
}

function resolveSource(input: string): string {
  if (!input) {
    return input;
  }

  if (isHttpUrl(input)) {
    return input;
  }

  if (!imageBaseUrl) {
    if (input.startsWith("/")) {
      return input;
    }
    return `/${normalizePath(input)}`;
  }

  return `${imageBaseUrl}/${normalizePath(input)}`;
}

function appendQiniuProcess(url: string, width: number, quality: number): string {
  const command = `imageView2/2/w/${width}/q/${quality}/format/webp`;
  if (!url.includes("?")) {
    return `${url}?${command}`;
  }
  return `${url}|${command}`;
}

function appendVolcProcess(url: string, width: number, quality: number): string {
  const command = `image/resize,w_${width}/quality,q_${quality}/format,webp`;
  const encoded = encodeURIComponent(command);
  if (!url.includes("?")) {
    return `${url}?x-tos-process=${encoded}`;
  }
  return `${url}&x-tos-process=${encoded}`;
}

export function buildImageUrl(
  input: string,
  options: ImageBuildOptions = {}
): string {
  const source = resolveSource(input);
  if (!source) {
    return source;
  }

  const width = Math.max(200, Math.round(options.width ?? 1280));
  const quality = Math.min(95, Math.max(40, Math.round(options.quality ?? 82)));
  const canProcess = Boolean(imageBaseUrl) || isHttpUrl(input);

  if (!canProcess) {
    return source;
  }

  if (imageProvider === "qiniu") {
    return appendQiniuProcess(source, width, quality);
  }

  if (imageProvider === "volc") {
    return appendVolcProcess(source, width, quality);
  }

  return source;
}
