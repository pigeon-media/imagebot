import fg from "fast-glob";
import { parse, relative, dirname, join } from "path";
import MagicString from "magic-string";

export async function createModule(file) {
  const url = new URL(import.meta.url);
  const _file = join(relative(dirname(url.pathname), process.cwd()), file);
  return await import(_file);
}

export async function createFileRoutes() {
  const files = await fg("pages/**/*.js", {
    dot: false,
    ignore: ["node_modules", ".git"],
    cwd: process.cwd(),
  });

  const routes = [];

  for (const file of files) {
    const { name, dir } = parse(file);
    const baseDir = dir.replace(/^pages/, "/");
    const urlPath = join(baseDir, name);
    const route = pathTransform(urlPath);
    routes.push({
      path: route,
      file,
    });
  }

  return routes;
}

/**
 *
 * @param {ReturnType<import("fastify")['fastify']>} server
 */
export async function registerRoutes(server) {
  const routes = await createFileRoutes();
  for (const route of routes) {
    server.log.info(`loaded route=${route.path}`);
    server.get(route.path, async (request, reply) => {
      const module = await createModule(route.file);
      const { loader, render } = module;
      const loaderAsyncFunc = loader || (async () => ({}));
      const renderAsyncFunc = render || (async () => ({}));
      const loaderResult = await loaderAsyncFunc(request);
      const renderResult = await renderAsyncFunc(request, loaderResult);
      return { file: route.file, params: request.params, loaderResult, renderResult };
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

await createFileRoutes();
