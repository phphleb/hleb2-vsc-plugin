import * as vscode from 'vscode';
import {directories} from "./projectPaths";

// Регулярное выражение для поиска строковых аргументов
const stringArgumentRegex = /(['"])(.*?)\1/g;

export function registerGlobalDirectoryPathProvider(context: vscode.ExtensionContext, root: string) {

    const directoryPaths = directories(root);

    function addCompletionsFromPaths(position: vscode.Position, linePrefix: string): vscode.CompletionItem[] {
        const completions: vscode.CompletionItem[] = [];
        const startPosition = position.with(position.line, linePrefix.lastIndexOf('@'));
        const range = new vscode.Range(startPosition, position);

        directoryPaths.forEach(dir => {
            const item = new vscode.CompletionItem(`@/${dir}`, vscode.CompletionItemKind.Folder);
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
