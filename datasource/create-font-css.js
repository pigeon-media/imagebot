import { join } from "path";
import fs from "fs-extra";
import { bufferToDataUri } from "./facetaste-client.js";
import { fileTypeFromBuffer } from "file-type";

/**
 * @param {string} file
 * @returns {Promise<string>}
 */
export async function svgFileToDataUri(file) {
  const buffer = await fs.readFile(file);
  return bufferToDataUri(buffer, "image/svg+xml");
}

/**
 *
 * @param {string} file
 * @returns {Promise<string>}
 */
export async function woff2FileToDataUri(file) {
  const buffer = await fs.readFile(file);
  const { mime } = await fileTypeFromBuffer(buffer);
  return bufferToDataUri(buffer, mime);
}

export async function createFontFacesString() {
  const url = async (file) => {
    const dataUri = await woff2FileToDataUri(join("./datasource/", file));
    return `url(${dataUri})`;
  };

  return `
  @font-face {
    font-display: block;
    font-family: "Koh Santepheap";
    src: ${await url("fonts/KohSantepheap-Thin.woff2")} format('woff2');
    font-weight: 100;
    unicode-range: U+1780-17FF;
  }

  @font-face {
    font-display: block;
    font-family: "Koh Santepheap";
    src: ${await url("fonts/KohSantepheap-Light.woff2")} format('woff2');
    font-weight: 300;
    unicode-range: U+1780-17FF;
  }

  @font-face {
    font-display: block;
    font-family: "Koh Santepheap";
    src: ${await url("fonts/KohSantepheap-Regular.woff2")} format('woff2');
    font-weight: 400;
    unicode-range: U+1780-17FF;
  }

  @font-face {
    font-display: block;
    font-family: "Koh Santepheap";
    src: ${await url("fonts/KohSantepheap-Bold.woff2")} format('woff2');
    font-weight: 600;
    unicode-range: U+1780-17FF;
  }

  
  @font-face {
    font-display: block;
    font-family: "Koh Santepheap";
    src: ${await url("fonts/KohSantepheapHead.woff2")} format('woff2');
    font-weight: 700;
    unicode-range: U+1780-17FF;
  }
  
  @font-face {
    font-display: block;
    font-family: "Proxima Nova Alt";
    src: ${await url("fonts/ProximaNovaA-Regular.woff2")} format('woff2');
    font-weight: normal;
  }
  
  @font-face {
    font-display: block;
    font-family: "Proxima Nova Alt";
    src: ${await url("fonts/ProximaNovaA-Bold.woff2")} format('woff2');
    font-weight: bold;
  }
  `;
}


await fs.writeFile('./layouts/_extra.css', `${await createFontFacesString()}`, 'utf8')