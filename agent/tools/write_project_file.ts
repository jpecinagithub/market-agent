import { lstat, writeFile } from "node:fs/promises";
import { relative } from "node:path";
import { defineTool } from "eve/tools";
import { always } from "eve/tools/approval";
import { z } from "zod";
import {
  PROJECT_ROOT,
  resolveWritableProjectPath,
} from "../lib/project-files";

export default defineTool({
  description:
    "Crea o sobrescribe un archivo de texto dentro del proyecto local. Antes de sobrescribir debe leer el archivo existente. Cada escritura necesita aprobación humana.",

  inputSchema: z.object({
    path: z
      .string()
      .min(1)
      .describe(
        "Ruta relativa, por ejemplo agent/instructions.md",
      ),
    content: z
      .string()
      .max(256_000)
      .describe("Contenido completo que se escribirá"),
    overwrite: z
      .boolean()
      .default(false)
      .describe(
        "Debe ser true para sobrescribir un archivo existente",
      ),
  }),

  approval: always(),

  label: {
    start: ({ path }) => `Preparando escritura en ${path}`,
  },

  async execute({ path, content, overwrite }) {
    const filePath = await resolveWritableProjectPath(path);

    const existing = await lstat(filePath).catch(
      (error: NodeJS.ErrnoException) => {
        if (error.code === "ENOENT") {
          return undefined;
        }

        throw error;
      },
    );

    if (existing?.isDirectory()) {
      throw new Error("La ruta corresponde a una carpeta.");
    }

    if (existing && !overwrite) {
      throw new Error(
        "El archivo ya existe. Léelo primero y vuelve a solicitar la escritura con overwrite=true.",
      );
    }

    await writeFile(filePath, content, {
      encoding: "utf8",
      flag: overwrite ? "w" : "wx",
    });

    return {
      success: true,
      path: relative(PROJECT_ROOT, filePath),
      bytesWritten: Buffer.byteLength(content, "utf8"),
      overwritten: Boolean(existing),
    };
  },
});