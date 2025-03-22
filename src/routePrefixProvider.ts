import * as vscode from 'vscode';

const prefixRegex = /Route::toGroup\((?:.*?)\)(?:->\w+\(.*?\))*->prefix\(['"]([^'"]+)['"]\).*?;/gs;

export function registerRoutePrefixProvider(context: vscode.ExtensionContext) {
    const hoverProvider = vscode.languages.registerHoverProvider('*', {
        provideHover(document, position) {
            const entireText = document.getText();
            let match;

            console.log(`HLEB2 DEBUG INFO ${this.constructor.name} provideHover`);

            while ((match = prefixRegex.exec(entireText)) !== null) {
                let prefixes = [];
                let prefixMatch;
                const innerRegex = /->prefix\(['"]([^'"]+)['"]\)/g;

                while ((prefixMatch = innerRegex.exec(match[0])) !== null) {
                    prefixes.push(prefixMatch[1]);
                }

                for (const prefixText of prefixes) {
                    const prefixWithQuotesSingle = `'${prefixText}'`;
                    const prefixWithQuotesDouble = `"${prefixText}"`;

                    let prefixQuotedIndex = match[0].indexOf(prefixWithQuotesSingle);
                    let quoteLength = 1;

                    if (prefixQuotedIndex === -1) {
                        prefixQuotedIndex = match[0].indexOf(prefixWithQuotesDouble);
                    }

                    if (prefixQuotedIndex === -1) {
                        continue;
                    }
                    const startPos = document.positionAt(
                        match.index + prefixQuotedIndex + quoteLength
                    );
                    const endPos = document.positionAt(
                        match.index + prefixQuotedIndex + quoteLength + prefixText.length
                    );

                    const wordRange = new vscode.Range(startPos, endPos);

                    if (wordRange.contains(position)) {
                        const lang = 'en';
                        const page = '/2/0/routing';

                        const hoverContent = new vscode.MarkdownString();
                        hoverContent.appendMarkdown(`**Route prefix**.  
                        HLEB2 Framework:  
                        [Documentation](https://hleb2framework.ru/${lang}${page})`);
                        hoverContent.isTrusted = true;
                        return new vscode.Hover(hoverContent);
                    }
                }
            }
            return;
        }
    });

    context.subscriptions.push(hoverProvider);

    const decorationType = vscode.window.createTextEditorDecorationType({
        color: '#0389d2',
        fontWeight: 'bold',
        fontStyle: 'italic',
    });

    function updateDecorations(editor: vscode.TextEditor, decorationType: vscode.TextEditorDecorationType) {
        const text = editor.document.getText();
        const decorations = [];
        let match;

        while ((match = prefixRegex.exec(text)) !== null) {
            let prefixes = [];
            let prefixMatch;
            const innerRegex = /->prefix\(['"]([^'"]+)['"]\)/g;

            while ((prefixMatch = innerRegex.exec(match[0])) !== null) {
                prefixes.push(prefixMatch[1]);
            }

            for (const prefixText of prefixes) {
                const prefixWithQuotesSingle = `'${prefixText}'`;
                const prefixWithQuotesDouble = `"${prefixText}"`;

                let prefixQuotedIndex = match[0].indexOf(prefixWithQuotesSingle);
                let quoteLength = 1;

                if (prefixQuotedIndex === -1) {
                    prefixQuotedIndex = match[0].indexOf(prefixWithQuotesDouble);
                }

                if (prefixQuotedIndex === -1) {
                    continue;
                }
                const startPos = editor.document.positionAt(
                    match.index + prefixQuotedIndex + quoteLength
                );
                const endPos = editor.document.positionAt(
                    match.index + prefixQuotedIndex + quoteLength + prefixText.length
                );

                decorations.push({range: new vscode.Range(startPos, endPos)});
            }
        }

        editor.setDecorations(decorationType, decorations);
    }

    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateDecorations(editor, decorationType);
        }
    });

    vscode.workspace.onDidChangeTextDocument(event => {
        const editor = vscode.window.activeTextEditor;
        if (editor && event.document === editor.document) {
            updateDecorations(editor, decorationType);
        }
    });

    const activeEditor = vscode.window.activeTextEditor;
    if (activeEditor) {
        updateDecorations(activeEditor, decorationType);
    }
}

