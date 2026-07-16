// QR code generation using the proven `qrcode` library.
// Replaces the custom implementation that had scanning issues on some devices.

import QRCode from "qrcode";

/**
 * Generate a QR code as a data URL (PNG) for inline <img> usage.
 */
export async function qrToDataURL(text: string, pixelSize = 6): Promise<string> {
  // High error correction (H) so the code still scans even if partially damaged.
  // Margin = 4 modules of quiet zone (recommended for reliable scanning).
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: "H",
    margin: 4,
    width: text.length * pixelSize * 8, // scale with content, min ~256px
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}

/**
 * Generate a QR code as an SVG string.
 */
export async function qrToSVG(text: string, pixelSize = 6): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "H",
    margin: 4,
    width: text.length * pixelSize * 8,
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
  });
}
