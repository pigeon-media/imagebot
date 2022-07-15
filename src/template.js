import fs from "fs/promises";
import fg from "fast-glob";
import { parse, join, resolve, sep } from "path";
import { pathToFileURL } from "url";
import inlineCss from "inline-css";
import Handlebars from "handlebars";

const assetsPath = join(process.cwd(), "assets", sep);
const assetsFileUrl = pathToFileURL(assetsPath).toString();

const _tree = await templatesTree();

export async function resolveTemplateId(id) {
  return _tree[id] || _tree["main"];
}

export async function templatesTree() {
  const files = await fg("layouts/**/*.handlebars", {
    dot: false,
    ignore: ["node_modules", ".git"],
    cwd: process.cwd(),
  });

  return Object.fromEntries(
    await Promise.all(
      files.map(async (file) => {
        const segments = file.split(sep);
        const id = segments
          .slice(1)
          .join(".")
          .replace(/\.handlebars$/i, "");
        return [id, await fs.readFile(file, "utf-8")];
      })
    )
  );
}

export async function compileTemplate(id, data) {
  const rawTemplate = await resolveTemplateId("image.basic");
  const template = Handlebars.compile(rawTemplate);
  const html = template({});
  const re = await inlineCss(html, {
    url: assetsFileUrl,
  });
}
