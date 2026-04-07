import pdfParse from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

export class PDFProcessor {
  private readonly splitter: RecursiveCharacterTextSplitter;

  constructor(
    private readonly chunkSize: number = 1000,
    private readonly chunkOverlap: number = 200
  ) {
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap,
      separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
    });
  }

  async extractText(buffer: Buffer): Promise<string> {
    const data = await pdfParse(buffer);
    return this.cleanText(data.text);
  }

  async splitIntoChunks(text: string): Promise<string[]> {
    const docs = await this.splitter.createDocuments([text]);
    return docs.map((doc) => doc.pageContent).filter((content) => content.trim().length > 50);
  }

  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
  }
}
