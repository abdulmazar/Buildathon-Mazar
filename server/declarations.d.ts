declare module "word-extractor" {
  export default class WordExtractor {
    extract(buffer: Buffer): Promise<{ getBody: () => string }>;
  }
}

declare module "pdf-parse" {
  export class PDFParse {
    constructor(options: { data: Buffer | Uint8Array });
    getText(): Promise<string>;
  }
  const pdfParse: (dataBuffer: Buffer, options?: any) => Promise<{ text: string; numpages: number; info: any }>;
  export default pdfParse;
}
