import * as vscode from 'vscode';
import { files, createTagNamedArray } from "./projectPaths";
import path from "path";

// Регулярное выражение для поиска строковых аргументов.
const stringArgumentRegex = /(['"])(.*?)\1/g;

/**
 * Создание специальной ссылки на файл, если такой файл существует.
 */
export function registerGlobalFilesLinkProvider(context: vscode.ExtensionContext, root: string) {
    const provider = vscode.languages.registerDocumentLinkProvider('php', {
        provideDocumentLinks(document: vscode.TextDocument): vscode.ProviderResult<vscode.DocumentLink[]> {
            const filePaths = createTagNamedArray(files(root));
            const links: vscode.DocumentLink[] = [];
            const text = document.getText();

            let match;
            while ((match = stringArgumentRegex.exec(text)) !== null) {
                const matchedText = match[2]; // Текст внутри кавычек
                const matchStart = document.positionAt(match.index);
                const matchEnd = document.positionAt(match.index + match[0].length);

                // Проверка, совпадает ли текст с любым из путей файлов.
                for (const [key, file] of Object.entries(filePaths)) {
                    if (matchedText === key) {
                        const linkRange = new vscode.Range(matchStart, matchEnd);
                        const link = new vscode.DocumentLink(linkRange, vscode.Uri.file(path.join(root, file)));
                        link.tooltip = `Open file: ${file}`;
                        links.push(link);
                    }
                }
            }

            return links.length ? links : [];
        }
    });

    context.subscriptions.push(provider);
}
