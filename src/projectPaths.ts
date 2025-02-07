import fs from "fs";
import path from "path";

let directoryPaths: string[] = [];
let filePaths: string[] = [];
let lastCacheTime: number = 0;
const cacheDuration: number = 30000; // 30 секунд в миллисекундах

/**
 * Возвращает список файлов проекта.
 */
export function files(dirPath: string) {
    if (!filePaths || shouldUpdateCache()) {
        // Сброс кеша перед новым сбором путей
        directoryPaths = [];
        filePaths = [];
        collectPaths(dirPath);
        lastCacheTime = Date.now();
    }

    return filePaths;
}

/**
 * Возвращает список директорий проекта.
 */
export function directories(dirPath: string) {
    if (!directoryPaths || shouldUpdateCache()) {
        // Сброс кеша перед новым сбором путей
        directoryPaths = [];
        filePaths = [];
        collectPaths(dirPath);
        lastCacheTime = Date.now();
    }

    return directoryPaths;
}

function shouldUpdateCache(): boolean {
    return Date.now() - lastCacheTime > cacheDuration;
}

function collectPaths(dirPath: string, relativePath: string = '') {
    if (fs.existsSync(dirPath)) {
        const entries = fs.readdirSync(dirPath);
        entries.forEach(entry => {
            if (entry.startsWith('.') || entry === 'vendor') {
                return;
            }
            const fullPath = path.join(dirPath, entry);
            const relativeEntryPath = path.join(relativePath, entry).replace(/\\/g, '/');
            if (fs.lstatSync(fullPath).isDirectory()) {
                directoryPaths.push(relativeEntryPath);
                // Рекурсивный вызов для вложенных директорий
                collectPaths(fullPath, relativeEntryPath);
            } else if (fullPath.endsWith('.php')) {
                filePaths.push(relativeEntryPath);
            }
        });
    }
}
