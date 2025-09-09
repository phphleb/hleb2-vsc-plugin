import * as vscode from 'vscode';
import path from "path";
import fs from 'fs';

const functionNames = [
    "view",
    "hl_view",
    "template",
    "hl_template",
    "insertTemplate",
    "hl_insert_template",
    "insertCacheTemplate",
    "hl_insert_cache_template",
    "Template::insertCache",
    "Template::insert",
    "Template::get",
];

const regexPattern = functionNames.join("|");
const viewFunctionRegex = new RegExp(`(${regexPattern})\\([\\s\\S]*?\\)`, "g");
const stringArgumentRegex = /(['"])(.*?)\1/g;

async function fileExists(filePath: string): Promise<boolean> {
    return new Promise((resolve) => {
        vscode.workspace.fs.stat(vscode.Uri.file(filePath)).then(
            () => resolve(true),
            () => resolve(false)
        );
    });
}

/**
 * Создание ссылок на файлы из функции view().
 * Работает для модулей.
 */
export function registerViewFunctionProvider(context: vscode.ExtensionContext, root: string) {
    const provider = vscode.languages.registerDocumentLinkProvider('php', {
        async provideDocumentLinks(document: vscode.TextDocument): Promise<vscode.DocumentLink[]> {
            const links: vscode.DocumentLink[] = [];
            const text = document.getText();
            let match;
            let moduleDir;

            const relativePath = path.relative(root, document.uri.fsPath);
            if (!relativePath.startsWith('app' + path.sep) &&
                !relativePath.startsWith('routes' + path.sep) &&
                !relativePath.startsWith('resources' + path.sep)) {
                if (relativePath.startsWith('vendor' + path.sep)) {
                    return [];
                }
                moduleDir = await findViewsDir(root, document.uri.fsPath);
                if (!moduleDir) {
                    return [];
                }
            }

            while ((match = viewFunctionRegex.exec(text)) !== null) {
                const currentFunc = match[1];
                const viewArgs = match[0].match(stringArgumentRegex);

                if (viewArgs && viewArgs.length > 0) {
                    const matchedText = viewArgs[0].slice(1, -1);

                    const updMatchedText = matchedText.replace(/^[/\\]+|[/\\]+$/g, '').replace(/\\/g, '/');

                    if (!/[$@\'\"]/.test(matchedText)) {
                        const matchStart = document.positionAt(match.index + viewArgs[0].indexOf(matchedText) + currentFunc.length + 1);
                        const matchEnd = document.positionAt(match.index + viewArgs[0].indexOf(matchedText) + matchedText.length + currentFunc.length + 1);

                        let moduleView;
                        if (moduleDir) {
                            moduleView = path.join(moduleDir, updMatchedText);
                            if (path.extname(moduleView) === '') {
                                moduleView += '.php';
                            }
                        }
                        // Определяется модуль это или папка resources.
                        let fullPath = moduleView && await fileExists(moduleView) ? moduleView : path.join(root, 'resources', 'views', updMatchedText);
                        if (path.extname(fullPath) === '') {
                            fullPath += '.php';
                        }
                        let decorationOptions = {
                            color: '#26a874',
                            textDecoration: '',
                            fontWeight: 'bold',
                            rangeBehavior: vscode.DecorationRangeBehavior.ClosedOpen,
                        };
                        // Проверяем существование файла
                        if (await fileExists(fullPath)) {

                            const linkRange = new vscode.Range(matchStart, matchEnd);
                            const link = new vscode.DocumentLink(linkRange, vscode.Uri.file(fullPath));
                            link.tooltip = `Open file: ${fullPath}`;
                            links.push(link);
                        }
                        const decoration = vscode.window.createTextEditorDecorationType(decorationOptions);
                        const activeEditor = vscode.window.activeTextEditor;

                        if (activeEditor) {
                            const decorationRange = new vscode.Range(matchStart, matchEnd);
                            activeEditor.setDecorations(decoration, [decorationRange]);
                        }
                    }
                }
            }

            return links.length ? links : [];
        }
    });

    context.subscriptions.push(provider);
}

/** Поиск директории **/
async function directoryExists(p: string): Promise<boolean> {
    try {
        const st = await fs.promises.stat(p);
        return st.isDirectory();
    } catch {
        return false;
    }
}

/** Возвращает путь до папки views в модуле или false, если не найдено. **/
async function findViewsDir(root: string, currentFilePath: string): Promise<string | false> {
    root = path.resolve(root);
    currentFilePath = path.resolve(currentFilePath);
    // Если текущий файл в корне.
    if (path.relative(path.dirname(currentFilePath), root) === '.') {
        return false;
    }

    const rel = path.relative(root, currentFilePath);
    const segments = rel === '.' ? [] : rel.split(path.sep).filter(Boolean);

    if (segments.length <= 1) {
        return  false;
    }

    for (let i = segments.length; i >= 0; i--) {
        const prefix = segments.slice(0, i).join(path.sep);
        if (prefix) {
            const candidateDir = path.join(root, prefix, 'views');
            if (candidateDir && await directoryExists(candidateDir)) {
                return candidateDir;
            }
        }
    }

    return false;
}
