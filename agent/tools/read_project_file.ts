import { readFile, stat } from "node:fs/promises";
import { relative } from "node:path";
import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  PROJECT_ROOT,
  resolveExistingProjectPath,
} from "../lib/project-files";

const MAXIMUM_FILE_SIZE = 256_000;

export default defineTool({
  description:
    "Lee un archivo de texto del proyecto local. Solo acepta rutas relativas y no puede leer secretos ni carpetas internas bloqueadas.",

  inputSchema: z.object({
    path: z
      .string()
      .min(1)
      .describe(
        "Ruta relativa, por ejemplo agent/instructions.md",
      ),
  }),

  label: {
    start: ({ path }) => `Leyendo ${path}`,
  },

  async execute({ path }) {
    const filePath = await resolveExistingProjectPath(path);
    const information = await stat(filePath);

    if (!information.isFile()) {
      throw new Error(`${path} no es un archivo.`);
    }

    if (information.size > MAXIMUM_FILE_SIZE) {
      throw new Error(
        `El archivo supera el límite de ${MAXIMUM_FILE_SIZE} bytes.`,
      );
    }

    return {
      path: relative(PROJECT_ROOT, filePath),
      size: information.size,
      content: await readFile(filePath, "utf8"),
    };
  },
});