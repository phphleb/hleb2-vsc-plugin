import * as vscode from 'vscode';
import {files, directories, createTagNamedArray} from "./projectPaths";

// Регулярное выражение для поиска строковых аргументов.
const stringArgumentRegex = /(['"])(.*?)\1/g;

/**
 * Автодополнение для директорий и файловых путей при назначении аргумента с начальным @.
 */
export function registerGlobalPathProvider(context: vscode.ExtensionContext, root: string) {

    const directoryPaths = createTagNamedArray(directories(root));
    const filePaths = createTagNamedArray(files(root));

    function addCompletionsFromPaths(position: vscode.Position, linePrefix: string): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        const startPosition = position.with(position.line, linePrefix.lastIndexOf('@'));
        const range = new vscode.Range(startPosition, position);
        for (const [key, file] of Object.entries(filePaths)) {
            const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.File);
            item.range = range;
            completions.push(item);
        }
        for (const [key, dir] of Object.entries(directoryPaths)) {
            const item = new vscode.CompletionItem(key, vscode.CompletionItemKind.Folder);
            item.range = range;
            completions.push(item);
        }

        // Сортировка items по алфавитному порядку и по длине
        completions.sort((a, b) => {
            const nameA = a.label.toString();
            const nameB = b.label.toString();

            // Сравнение по алфавиту
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;

            // Если строки равны по алфавиту, сравниваем по длине
            return nameA.length - nameB.length;
        });

        return completions;
    }

    const provider = vscode.languages.registerCompletionItemProvider('php', {
        provideCompletionItems(document: vscode.TextDocument, position: vscode.Position) {
            const lineText = document.lineAt(position).text;
            const linePrefix = lineText.substr(0, position.character);

            const matches = lineText.match(stringArgumentRegex);
            if (matches) {
                let isInsideString = false;
                matches.forEach(match => {
                    const start = lineText.indexOf(match);
                    const end = start + match.length;
                    if (position.character > start && position.character < end) {
                        isInsideString = true;
                        if (match[1] !== '@') { // Проверка символа '@' после кавычки
                            isInsideString = false;
                        }
                    }
                });

                if (!isInsideString) {
                    return undefined;
                }
            }

            return addCompletionsFromPaths(position, linePrefix);
        }
    }, '@', '/', '.');

    context.subscriptions.push(provider);
}
