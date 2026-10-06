import { lstat, realpath } from "node:fs/promises";
import {
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";

export const PROJECT_ROOT = resolve(process.cwd());

const blockedDirectories = new Set([
  ".git",
  ".eve",
  "node_modules",
]);

function assertInsideProject(root: string, candidate: string): void {
  const relativePath = relative(root, candidate);

  if (
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    throw new Error("La ruta está fuera del proyecto.");
  }
}

function validateRelativePath(input: string): string {
  const normalized = input.trim().replaceAll("\\", "/");

  if (!normalized || normalized === ".") {
    return ".";
  }

  if (
    normalized.startsWith("/") ||
    /^[a-zA-Z]:/.test(normalized)
  ) {
    throw new Error(
      "Utiliza una ruta relativa al proyecto, no una ruta absoluta.",
    );
  }

  const segments = normalized
    .split("/")
    .filter((segment) => segment && segment !== ".");

  for (const segment of segments) {
    const lower = segment.toLowerCase();

    if (segment === "..") {
      throw new Error("No se permite salir de la carpeta del proyecto.");
    }

    if (segment.includes(":")) {
      throw new Error("La ruta contiene caracteres no permitidos.");
    }

    if (blockedDirectories.has(lower)) {
      throw new Error(`No se permite acceder a ${segment}.`);
    }

    if (lower === ".env" || lower.startsWith(".env.")) {
      throw new Error("No se permite acceder a archivos de entorno.");
    }
  }

  return segments.join(sep);
}

export function resolveProjectPath(input = "."): string {
  const safeRelativePath = validateRelativePath(input);
  const candidate = resolve(PROJECT_ROOT, safeRelativePath);

  assertInsideProject(PROJECT_ROOT, candidate);

  return candidate;
}

export async function resolveExistingProjectPath(
  input = ".",
): Promise<string> {
  const candidate = resolveProjectPath(input);
  const [realRoot, realCandidate] = await Promise.all([
    realpath(PROJECT_ROOT),
    realpath(candidate),
  ]);

  assertInsideProject(realRoot, realCandidate);

  return realCandidate;
}

export async function resolveWritableProjectPath(
  input: string,
): Promise<string> {
  const candidate = resolveProjectPath(input);
  const [realRoot, realParent] = await Promise.all([
    realpath(PROJECT_ROOT),
    realpath(dirname(candidate)),
  ]);

  assertInsideProject(realRoot, realParent);

  const information = await lstat(candidate).catch(
    (error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") {
        return undefined;
      }

      throw error;
    },
  );

  if (information?.isSymbolicLink()) {
    throw new Error(
      "No se permite escribir mediante un enlace simbólico.",
    );
  }

  return candidate;
}