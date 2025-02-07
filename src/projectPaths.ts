import fs from "fs";
import path from "path";

let directoryPaths: string[] = [];
let filePaths: string[] = [];
let lastCacheTime: number = 0;
const cacheDuration: number = 10000; // 10 секунд в миллисекундах

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

/**
 * Преобразует список папок или файлов в именованный массив [tag => value].
 */
export function createTagNamedArray(paths: string[]): Record<string, string> {
    const uniqueNames: Record<string, string> = {};
    const seenPaths = new Set();

    const replacements = {
        '@storage': 'storage',
        '@views': 'resources/views',
        '@app': 'app',
        '@resources': 'resources'
    };

    paths.forEach((p: string) => {
        p = p.replace(/^[\\/]+/, '');

        if (seenPaths.has(p)) return;
        seenPaths.add(p);

        for (const [key, value] of Object.entries(replacements)) {
            if (p.startsWith(value)) {
                let tag = key;
                if (p !== value) {
                    tag = key + p.substring(value.length);
                }
                uniqueNames[tag] = p;
            }
        }
        uniqueNames['@/' + p] = p;
    });

    return uniqueNames;
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
            } else {
                filePaths.push(relativeEntryPath);
            }
        });
    }
}
