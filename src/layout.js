import fse from "fs-extra";
import { join } from "path";

export async function resolveLayout(filename) {
  const file = join(process.cwd(), "layouts", filename);
  if (!fse.pathExists(file)) return "";
  return fse.readFile(file, "utf8");
}
