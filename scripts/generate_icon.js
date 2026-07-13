import { Jimp } from "jimp";
import fs from "fs";
import path from "path";

async function main() {
  const jpgPath = "assets/icon.jpg";
  const pngPath = "assets/icon.png";
  const icoPath = "assets/icon.ico";

  try {
    console.log(`Loading image from ${jpgPath}...`);
    if (!fs.existsSync(jpgPath)) {
      throw new Error(`File not found: ${jpgPath}`);
    }

    // Load JPEG
    const image = await Jimp.read(jpgPath);
    console.log(`Successfully loaded ${jpgPath}. Original size: ${image.width}x${image.height}`);

    // Resize to 256x256 (standard high-res icon size)
    image.resize({ w: 256, h: 256 });
    console.log(`Resized image to 256x256`);

    // Ensure assets directory exists
    const assetsDir = path.dirname(pngPath);
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }

    // Get PNG buffer
    const pngBuffer = await image.getBuffer("image/png");
    
    // Save PNG
    fs.writeFileSync(pngPath, pngBuffer);
    console.log(`Saved genuine PNG to ${pngPath}`);

    // Compose valid Windows ICO file (PNG-compressed format)
    const pngSize = pngBuffer.length;
    const icoBuffer = Buffer.alloc(22 + pngSize);

    // 1. ICO Header (6 bytes)
    icoBuffer.writeUInt16LE(0, 0);     // Reserved
    icoBuffer.writeUInt16LE(1, 2);     // Type (1 for ICO)
    icoBuffer.writeUInt16LE(1, 4);     // Count (1 image)

    // 2. Directory Entry (16 bytes)
    icoBuffer.writeUInt8(0, 6);        // Width (0 represents 256)
    icoBuffer.writeUInt8(0, 7);        // Height (0 represents 256)
    icoBuffer.writeUInt8(0, 8);        // Palette count (0 = no palette)
    icoBuffer.writeUInt8(0, 9);        // Reserved
    icoBuffer.writeUInt16LE(1, 10);    // Color planes (1)
    icoBuffer.writeUInt16LE(32, 12);   // Bits per pixel (32)
    icoBuffer.writeUInt32LE(pngSize, 14); // Size of PNG data
    icoBuffer.writeUInt32LE(22, 18);   // Offset to PNG data (22 bytes)

    // 3. PNG data
    pngBuffer.copy(icoBuffer, 22);

    // Save ICO
    fs.writeFileSync(icoPath, icoBuffer);
    console.log(`Saved genuine Windows ICO to ${icoPath}`);
    console.log("SUCCESS: All icon formats generated perfectly!");

  } catch (err) {
    console.error("FATAL ERROR during icon generation:", err);
    process.exit(1);
  }
}

main();
