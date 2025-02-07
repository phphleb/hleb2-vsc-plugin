import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

// Регулярное выражение для поиска строковых аргументов
const stringArgumentRegex = /(['"])(.*?)\1/g;

let directoryPaths: string[] = [];
let filePaths: string[] = [];

export function registerGlobalPathProvider(context: vscode.ExtensionContext, root: string) {

    // Собирает актуальные пути в переменные.
    function collectPaths(dirPath: string, relativePath: string = '') {
        if (fs.existsSync(dirPath)) {
            const entries = fs.readdirSync(dirPath);
            entries.forEach(entry => {
                const fullPath = path.join(dirPath, entry);
                // Преобразование обратного слэша в прямой
                const relativeEntryPath = path.join(relativePath, entry).replace(/\\/g, '/');
                if (entry === 'vendor') {
                    return;
                }
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

    if (!directoryPaths.length) {
        collectPaths(root);
    }

    function addCompletionsFromPaths(position: vscode.Position, linePrefix: string): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        const startPosition = position.with(position.line, linePrefix.lastIndexOf('@'));
        const endPosition = position;
        const range = new vscode.Range(startPosition, endPosition);

        directoryPaths.forEach(dir => {
            const item = new vscode.CompletionItem(`@/${dir}`, vscode.CompletionItemKind.Folder);
            item.range = range;
            completions.push(item);
        });

        filePaths.forEach(file => {
            const item = new vscode.CompletionItem(`@/${file}`, vscode.CompletionItemKind.File);
            item.detail = `Link to ${file}`;
            item.range = range;
            completions.push(item);
        });

        return completions;
    }

    const provider = vscode.languages.registerCompletionItemProvider('php', {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
            const lineText = document.lineAt(position).text;
            const linePrefix = lineText.substr(0, position.character);

            if (!linePrefix.includes('@')) {
                return undefined;
            }

            // Проверяем, если курсор находится в строковом аргументе
            const matches = lineText.match(stringArgumentRegex);
            if (matches) {
                let isInsideString = false;
                matches.forEach(match => {
                    const start = lineText.indexOf(match);
                    const end = start + match.length;
                    if (position.character > start && position.character < end) {
                        isInsideString = true;
                    }
                });

                if (!isInsideString) {
                    return undefined;
                }
            }

            return addCompletionsFromPaths(position, linePrefix);
        }
    }, '@');

    context.subscriptions.push(provider);
}
