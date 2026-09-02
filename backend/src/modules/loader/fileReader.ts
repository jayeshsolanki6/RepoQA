import fs from "fs/promises";
import path from "path";

export interface RepositoryFile {
    path: string;
    extension: string;
    content: string;
}

const IGNORED_FILES = new Set([
    "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
    "bun.lockb", "composer.lock", "Gemfile.lock",
    "Cargo.lock",
]);

const IGNORED_FOLDERS = new Set([
    "node_modules", "dist", "build",
    ".git", "vendor", "__pycache__",
    ".venv", "venv", "target",
    "coverage", ".next", ".turbo",
    ".vscode", ".idea",
]);

const SUPPORTED_EXTENSIONS = new Set([
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".java", ".py", ".cpp", ".c", ".h", ".hpp",
    ".cs", ".go", ".rs", ".php", ".rb", ".swift",
    ".kt", ".scala", ".dart", ".vue", ".svelte", ".html",
    ".css", ".scss", ".sass", ".less", ".json", ".yaml",
    ".yml", ".xml", ".toml", ".sql", ".md", ".mdx", ".txt", ".rst",
]);

export const readRepository = async (directory: string): Promise<RepositoryFile[]> => {
    const files: RepositoryFile[] = [];

    await walk(directory);

    async function walk(currentPath: string) {
        const entries = await fs.readdir(currentPath, {
            withFileTypes: true,
        });

        for (const entry of entries) {
            // Ignore folders
            if (entry.isDirectory()) {
                if (IGNORED_FOLDERS.has(entry.name)) {
                    continue;
                }

                await walk(path.join(currentPath, entry.name));
                continue;
            }

            // Ignore files
            if (IGNORED_FILES.has(entry.name)) {
                continue;
            }

            const extension = path.extname(entry.name).toLowerCase();

            // Ignore unsupported extensions
            if (!SUPPORTED_EXTENSIONS.has(extension)) {
                continue;
            }

            const fullPath = path.join(currentPath, entry.name);

            const content = await fs.readFile(fullPath, "utf8");

            // Convert Windows "\" paths to "/" paths
            const relativePath = path
                .relative(directory, fullPath)
                .split(path.sep)
                .join("/");

            files.push({
                path: relativePath,
                extension,
                content,
            });
        }
    }

    return files;
};