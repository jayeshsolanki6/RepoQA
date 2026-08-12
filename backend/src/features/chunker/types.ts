export interface RepositoryFile {
    path: string;
    extension: string;
    content: string;
}

export interface CodeChunk {
    filePath: string;
    extension: string;
    content: string;
    startLine: number;
    endLine: number;
}