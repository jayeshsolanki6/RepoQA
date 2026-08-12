import fs from "fs/promises";
import path from "path";

interface RepositoryFile {
    path: string;
    extension: string;
    content: string;
}

const IGNORED_FOLDERS = [
  "node_modules", "dist", "build",
  ".git", "vendor",
  "__pycache__", ".venv", "venv",
  "target", "coverage", ".next",
  ".turbo", ".vscode", ".idea",
];

const SUPPORTED_EXTENSIONS = [
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".java", ".py", ".cpp", ".c", ".h", ".hpp", ".cs", ".go", ".rs",
  ".php", ".rb", ".swift", ".kt", ".scala", ".dart", ".vue", ".svelte",
  ".html", ".css", ".scss", ".sass", ".less",
  ".json", ".yaml", ".yml", ".xml", ".toml", ".sql",
  ".md", ".mdx", ".txt", ".rst",
];

export const readRepository = async (directory: string): Promise<RepositoryFile[]> => {

    const files: RepositoryFile[] = [];

    await walk(directory);

    async function walk(currentPath: string) {

        const entries = await fs.readdir(currentPath, {
            withFileTypes: true,
        });

        for (const entry of entries) {
            const fullPath = path.join(currentPath, entry.name);
            if (entry.isDirectory()) {
                if (IGNORED_FOLDERS.includes(entry.name)) {
                    continue;
                }
                await walk(fullPath);
            }

            else {
                const extension = path.extname(entry.name);
                if (!SUPPORTED_EXTENSIONS.includes(extension)) {
                    continue;
                }
                const content = await fs.readFile(fullPath, "utf8");

                files.push({
                    path: path.relative(directory, fullPath),
                    extension,
                    content,
                });
            }
        }
    }

    return files;
};