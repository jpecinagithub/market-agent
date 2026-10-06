import { readdir, stat } from "node:fs/promises";
import { relative } from "node:path";
import { defineTool } from "eve/tools";
import { z } from "zod";
import {
  PROJECT_ROOT,
  resolveExistingProjectPath,
} from "../lib/project-files";

export default defineTool({
  description:
    "Lista los archivos y carpetas de un directorio del proyecto local. Solo acepta rutas relativas al proyecto.",

  inputSchema: z.object({
    path: z
      .string()
      .default(".")
      .describe(
        "Directorio relativo al proyecto, por ejemplo agent o agent/tools",
      ),
  }),

  label: {
    start: ({ path }) => `Listando archivos de ${path}`,
  },

  async execute({ path }) {
    const directory = await resolveExistingProjectPath(path);
    const information = await stat(directory);

    if (!information.isDirectory()) {
      throw new Error(`${path} no es una carpeta.`);
    }

    const entries = await readdir(directory, {
      withFileTypes: true,
    });

    return {
      path: relative(PROJECT_ROOT, directory) || ".",
      entries: entries.slice(0, 200).map((entry) => ({
        name: entry.name,
        type: entry.isDirectory()
          ? "directory"
          : entry.isFile()
            ? "file"
            : entry.isSymbolicLink()
              ? "symbolic-link"
              : "other",
      })),
      truncated: entries.length > 200,
    };
  },
});