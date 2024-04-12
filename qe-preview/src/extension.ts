import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { extractRelevantData } from './dataExtractor'; // Import the function

let currentPanel: vscode.WebviewPanel | undefined = undefined;

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
            updateWebViewContent(editor);
        }
    }));

    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        if (vscode.window.activeTextEditor && event.document === vscode.window.activeTextEditor.document) {
            updateWebViewContent(vscode.window.activeTextEditor);
        }
    }));

    console.log('Congratulations, your extension "qe-preview" is now active!');

    // Register the 'qe-preview.helloWorld' command
    let disposableHelloWorld = vscode.commands.registerCommand('extension.helloWorld', () => {
        vscode.window.showInformationMessage('Hello World!');
    });
    context.subscriptions.push(disposableHelloWorld);

    let disposableWebview = vscode.commands.registerCommand('extension.openLivePreview', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            openPreview(context, editor);
        } else {
            vscode.window.showInformationMessage("Open a file to see its preview.");
        }
    });
    context.subscriptions.push(disposableWebview);
}

function openPreview(context: vscode.ExtensionContext, editor: vscode.TextEditor) {
    if (!currentPanel) {
        currentPanel = vscode.window.createWebviewPanel(
            'livePreview',
            'Live Preview',
            vscode.ViewColumn.Beside,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );
        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        });
    }
    updateWebViewContent(editor);
}

async function updateWebViewContent(editor: vscode.TextEditor) {
    if (currentPanel && editor) {
        const document = editor.document;
        if (document.languageId === "out") {
            const extractedContent = await extractRelevantData(document.getText());
            currentPanel.webview.html = getHtmlContent(extractedContent);
        }
    }
}

function getHtmlContent(content: string): string {
    const htmlPath = path.join(__dirname, '../src/webViewContent.html');
    let htmlTemplate = fs.readFileSync(htmlPath, 'utf8');
    return htmlTemplate.replace('{{content}}', content);
}

// This method is called when your extension is deactivated
export function deactivate() {
    if (currentPanel) {
        currentPanel.dispose();
    }
}
