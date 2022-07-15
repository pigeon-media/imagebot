import fg from "fast-glob";
import { relative, dirname, join, sep } from "path";
import MagicString from "magic-string";
import normalizePath from "normalize-path";
import fse from "fs-extra";
import Handlebars from "handlebars";
import { resolveLayout } from "./layout.js";
import { isAsyncFunction } from "util/types";
import inlineCss from "inline-css";
import { pathToFileURL } from "url";
import { renderHtmlAsImageBuffer } from "./renderer.js";

export async function createModule(file) {
  const url = new URL(import.meta.url);
  const _file = join(relative(dirname(url.pathname), process.cwd()), file);
  return await import(_file);
}

export async function createFileRoutes() {
  const files = await fg("pages/**/*/main.{js,mjs,cjs}", {
    dot: false,
    ignore: ["node_modules", ".git"],
    cwd: process.cwd(),
  });

  const routes = [];

  for (const file of files) {
    const styleFile = join(dirname(file), "main.css");
    const templateFile = join(dirname(file), "main.handlebars");

    const styleExists = await fse.pathExists(styleFile);
    const templateExists = await fse.pathExists(templateFile);

    let style = null;
    let template = null;

    if (styleExists) {
      style = await fse.readFile(styleFile, "utf8");
    }

    if (templateExists) {
      template = await fse.readFile(templateFile, "utf8");
    }

    const segments = file.split(sep);
    const urlPath = normalizePath(
      join("/", ...segments.slice(1, -1)).replace(/\.[cm]?js$/i, "")
    );

    const route = pathTransform(urlPath);

    routes.push({
      path: route,
      file,
      style,
      template,
    });
  }

  return routes;
}

async function invokeAsyncFunc(func, context) {
  if (typeof func === "function") {
    if (isAsyncFunction(func)) {
      return await func(context);
    } else {
      return func(context);
    }
  }
}

async function render(request, route) {
  const module = await createModule(route.file);
  const { layout = "main.handlebars" } = module;
  const loaderResult = (await invokeAsyncFunc(module.default, request)) || {};
  const layoutContent = await resolveLayout(layout);
  const size = (await invokeAsyncFunc(module.size)) || {};
  const merged = layoutContent.replace(/<!--output-->/g, route.template);
  const template = Handlebars.compile(merged);
  const html = template(loaderResult);
  const renderedHtml = await inlineCss(html, {
    extraCss: route.style || "",
    url: pathToFileURL(join(process.cwd(), "layouts/")).toString(),
  });

  return { html: renderedHtml, size };
}

/**
 *
 * @param {ReturnType<import("fastify")['fastify']>} server
 */
export async function registerRoutes(server) {
  const routes = await createFileRoutes();
  for (const route of routes) {
    server.log.info(`loaded route=${route.path}`);
    server.get(route.path + ".html", async (request, reply) => {
      const { html } = await render(request, route);
      reply.type("text/html; charset=utf-8");
      reply.send(html);
    });

    server.get(route.path, async (request, reply) => {
      const { html, size } = await render(request, route);
      const jpegBuffer = await renderHtmlAsImageBuffer(html, size);
      reply.type("image/jpeg");
      return jpegBuffer;
    });
  }
}

function pathTransform(url) {
  const regex = /\[(\w+)\]/gm;
  let result;
  const str = new MagicString(url);
  while ((result = regex.exec(url))) {
    const start = result.index;
    const end = result.index + result[0].length;
    const param = result[1];
    str.overwrite(start, end, `:${param}`);
  }
  return str.toString();
}
