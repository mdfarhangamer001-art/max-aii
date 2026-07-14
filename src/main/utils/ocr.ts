import { ipcMain } from 'electron';
import { screen } from 'electron';
import * as screenshot from 'screenshot-desktop';

interface OCRResult {
  text: string;
  confidence: number;
  regions: Array<{
    text: string;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
}

class OCREngine {
  async captureScreen(): Promise<Buffer> {
    const img = await screenshot.all();
    return Buffer.from(img);
  }

  async extractText(imageBuffer: Buffer): Promise<OCRResult> {
    // Mock OCR - Replace with Tesseract.js or pytesseract
    return {
      text: 'Extracted text from screen',
      confidence: 0.92,
      regions: [
        {
          text: 'Sample Region',
          bbox: { x: 100, y: 100, width: 200, height: 50 },
        },
      ],
    };
  }

  async captureRegion(
    x: number,
    y: number,
    width: number,
    height: number
  ): Promise<Buffer> {
    const img = await screenshot.all();
    // Crop logic would go here
    return Buffer.from(img);
  }
}

const ocrEngine = new OCREngine();

// ==================== IPC HANDLERS ====================
export function registerOCRHandlers() {
  ipcMain.handle('ocr:capture-screen', async () => {
    const buffer = await ocrEngine.captureScreen();
    return { success: true, data: buffer.toString('base64') };
  });

  ipcMain.handle('ocr:extract-text', async (event, imageBuffer: Buffer) => {
    const result = await ocrEngine.extractText(imageBuffer);
    return result;
  });

  ipcMain.handle('ocr:capture-region', async (event, x: number, y: number, w: number, h: number) => {
    const buffer = await ocrEngine.captureRegion(x, y, w, h);
    return { success: true, data: buffer.toString('base64') };
  });
}

export { OCREngine, ocrEngine };