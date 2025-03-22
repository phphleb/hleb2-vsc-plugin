import * as vscode from 'vscode';

const routeRegex = /\b(?:get|post|put|delete|patch|options|any|match)\b\s*\(\s*['"]([^'"]+)['"]/g;

export function registerRouteAddressProvider(context: vscode.ExtensionContext) {
    const routeDecorationType = vscode.window.createTextEditorDecorationType({
        color: '#0389d2',
        fontWeight: 'bold'
    });

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDecorations(editor, routeDecorationType);
        }
    });

    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            updateDecorations(editor, routeDecorationType);
        }
    });

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        updateDecorations(activeEditor, routeDecorationType);
    }

    // Добавление всплывающей подсказки для выделенного текста
    const hoverProvider = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'php' }, {
        provideHover(document, position) {
            const lineText = document.lineAt(position).text; // Получаем текст всей строки

            console.log(`HLEB2 DEBUG INFO ${this.constructor.name} provideHover`);

            let match;
            while ((match = routeRegex.exec(lineText)) !== null) {
                const start = match.index;
                const end = match.index + match[0].length;
                const wordRange = new vscode.Range(position.line, start, position.line, end);

                if (wordRange.contains(position)) {
                    const lang = 'en';
                    const page = '/2/0/routing';

                    const hoverContent = new vscode.MarkdownString();
                    hoverContent.appendMarkdown(`**Route address**.  
                    HLEB2 Framework:  
                    [Documentation](https://hleb2framework.ru/${lang}${page})`);
                    hoverContent.isTrusted = true;

                    return new vscode.Hover(hoverContent);
                }
            }

            return;
        }
    });


    context.subscriptions.push(hoverProvider);
}

function updateDecorations(editor: vscode.TextEditor, decorationType: vscode.TextEditorDecorationType) {
    const text = editor.document.getText();

    const decorations: vscode.DecorationOptions[] = [];
    let match;
    while ((match = routeRegex.exec(text)) !== null) {
        const routeAddress = match[1];
        const startPos = editor.document.positionAt(match.index + match[0].indexOf(routeAddress));
        const endPos = editor.document.positionAt(match.index + match[0].indexOf(routeAddress) + routeAddress.length);

        decorations.push({ range: new vscode.Range(startPos, endPos) });
    }

    editor.setDecorations(decorationType, decorations);
}
