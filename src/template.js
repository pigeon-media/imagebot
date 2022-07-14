import fs from "fs/promises";
import fg from "fast-glob";
import { parse, join, resolve } from "path";
import { pathToFileURL, fileURLToPath } from "url";
import inlineCss from "inline-css";
import Handlebars from "handlebars";

const _tree = await templatesTree();

export async function resolveTemplateId(id) {
  return _tree[id] || _tree["main"];
}

export async function templatesTree() {
  const files = await fg("./layouts/**/*.handlebars", {
    dot: false,
    ignore: ["node_modules", ".git"],
    cwd: process.cwd(),
  });

  return Object.fromEntries(
    await Promise.all(
      files.map(async (file) => {
        const { dir, name } = parse(file);
        const id = join(dir.replace(/^\.\/layouts/, "/"), name).slice(1);
        return [id, await fs.readFile(file, 'utf-8')];
      })
    )
  );
}

const rawTemplate = await resolveTemplateId("main");
const template = Handlebars.compile(rawTemplate);
const html = template({ datetime: new Date().toISOString() });

const re = await inlineCss(html, {
  url: pathToFileURL(process.cwd()).toString() + "/assets/",
});

console.log(re)