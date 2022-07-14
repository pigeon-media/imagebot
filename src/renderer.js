import { launch } from "puppeteer-core";

/**
 * @type {import('puppeteer-core').Browser | null}
 */
let _browser = null;

/**
 * @type {import('puppeteer-core').Page | null}
 */
let _page = null;

const minimalArgs = [
  "--autoplay-policy=user-gesture-required",
  "--disable-background-networking",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-breakpad",
  "--disable-client-side-phishing-detection",
  "--disable-component-update",
  "--disable-default-apps",
  "--disable-dev-shm-usage",
  "--disable-domain-reliability",
  "--disable-extensions",
  "--disable-features=AudioServiceOutOfProcess",
  "--disable-hang-monitor",
  "--disable-ipc-flooding-protection",
  "--disable-notifications",
  "--disable-offer-store-unmasked-wallet-cards",
  "--disable-popup-blocking",
  "--disable-print-preview",
  "--disable-prompt-on-repost",
  "--disable-renderer-backgrounding",
  "--disable-setuid-sandbox",
  "--disable-speech-api",
  "--disable-sync",
  "--hide-scrollbars",
  "--ignore-gpu-blacklist",
  "--metrics-recording-only",
  "--mute-audio",
  "--no-default-browser-check",
  "--no-first-run",
  "--no-pings",
  "--no-sandbox",
  "--no-zygote",
  "--password-store=basic",
  "--use-gl=swiftshader",
  "--use-mock-keychain",
];

function _createArgs() {
  if (process.env.NODE_ENV === "production") return minimalArgs;
  return [];
}

function _executionPath() {
  return process.platform === "win32"
    ? "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
    : process.platform === "linux"
    ? "/usr/bin/google-chrome"
    : "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
}

export async function createBrowser() {
  if (_browser == null) {
    _browser = await launch({
      args: _createArgs(),
      headless: true,
      executablePath: _executionPath(),
    });
  }

  return _browser;
}

export async function createPage() {
  const browser = await createBrowser();
  if (_page == null) {
    _page = await browser.newPage();
  }
  return _page;
}

/**
 *
 * @param {string} html
 * @param {import('puppeteer-core').ScreenshotOptions | undefined} options
 * @returns {Promise<Buffer>}
 */
export async function renderHtmlAsImageBuffer(
  html,
  options = { type: "jpeg", quality: 85 }
) {
  const page = await createPage();
  page.setViewport({ width: 0, height: 0 });
  page.setContent(html);
  return page.screenshot(options);
}

export async function shutdown() {
  if (_browser == null) return;
  await _browser.close();
}