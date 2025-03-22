import * as vscode from 'vscode'

// Регулярное выражение для поиска вызова функций debug.
// Функции: var_dump(), dd(), print_r(), var_dump2(), dump().
// Дополнительно захватывается первый аргумент.
const debugFunctionRegex = /(?:var_dump|dd|print_r|var_dump2|dump)\(\s*((?:"(?:\\"|[^"])*"|'(?:\\'|[^'])*'|[^,)\s]+))/g

export function registerDebugInfoProvider(context: vscode.ExtensionContext) {

    const decorationType = vscode.window.createTextEditorDecorationType({
        textDecoration: 'underline solid yellow'
    })

    function updateDecorations() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const text = editor.document.getText();
        const decorations: vscode.DecorationOptions[] = [];

        let match: RegExpExecArray | null;
        while ((match = debugFunctionRegex.exec(text)) !== null) {
            const argText = match[1];
            const argIndex = match[0].indexOf(argText);
            const startOffset = match.index + argIndex;
            const endOffset = startOffset + argText.length;
            const startPos = editor.document.positionAt(startOffset);
            const endPos = editor.document.positionAt(endOffset);
            const range = new vscode.Range(startPos, endPos);
            decorations.push({ range });
        }

        editor.setDecorations(decorationType, decorations);
    }

    if (vscode.window.activeTextEditor) {
        updateDecorations()
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDecorations();
        }
    }, null, context.subscriptions)

    vscode.workspace.onDidChangeTextDocument(event => {
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            updateDecorations();
        }
    }, null, context.subscriptions)

    const hoverProvider = vscode.languages.registerHoverProvider({ scheme: 'file', language: 'php' }, {
        provideHover(document, position) {
            const entireText = document.getText();
            let match: RegExpExecArray | null;

            console.log(`HLEB2 DEBUG INFO ${this.constructor.name} provideHover`);

            while ((match = debugFunctionRegex.exec(entireText)) !== null) {
                const argText = match[1];
                const argIndex = match[0].indexOf(argText);
                const startOffset = match.index + argIndex;
                const endOffset = startOffset + argText.length;
                const startPos = document.positionAt(startOffset);
                const endPos = document.positionAt(endOffset);
                const range = new vscode.Range(startPos, endPos);

                if (range.contains(position)) {
                    const markdown = new vscode.MarkdownString();
                    markdown.appendMarkdown('HLEB2 Info: Output of debugging information.');
                    markdown.isTrusted = true;
                    return new vscode.Hover(markdown, range);
                }
            }
            return undefined;
        }
    })

    context.subscriptions.push(hoverProvider)
}
