import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

let currentPanel: vscode.WebviewPanel | undefined = undefined;
let regexConfigs: any[] = [];
let htmlPath: string = '';
let jsonPath: string = '';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    jsonPath = context.asAbsolutePath(path.join('resources', 'regexPatterns.json'))
    htmlPath = context.asAbsolutePath(path.join('resources', 'webViewContent.html'))
    regexConfigs = loadRegexConfigurations();
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
    let htmlTemplate = fs.readFileSync(htmlPath, 'utf8');
    return htmlTemplate.replace('{{content}}', content);
}

interface RegexConfig {
    name: string;
    regex: string;
    renderType: string;
    outputFormat: string;
}

// Load regex configurations synchronously
function loadRegexConfigurations(): RegexConfig[] {
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(jsonData);
}

export function extractRelevantData(documentText: string): string {
    let tableRows = regexConfigs.map(config => {
        const regex = new RegExp(config.regex, 'g');
        const matches = [];
        let match;

        while ((match = regex.exec(documentText)) !== null) {
            matches.push(match[1]);
        }
        let outputFormat = config.outputFormat.replace('{value}', '<span class="button" onclick="copyToClipboard(\'{value}\')">{value}</span>');
        console.log(outputFormat);

        // Determine what to show in the second column based on matches
        let formattedResult;
        switch (config.renderType) {
            case 'first':
                formattedResult = matches.length > 0 ? outputFormat.replace(/{value}/g, matches[0]) : "No matches found.";
                break;
            case 'last':
                formattedResult = matches.length > 0 ? outputFormat.replace(/{value}/g, matches[matches.length - 1]) : "No matches found.";
                break;
            case 'all':
                if (matches.length === 1) {
                    formattedResult = outputFormat.replace(/{value}/g, matches[0]);
                } else if (matches.length > 1) {
                    const first = outputFormat.replace(/{value}/g, matches[0]);
                    const last = outputFormat.replace(/{value}/g, matches[matches.length - 1]);
                    const collapsed = matches.slice(1, matches.length - 1).map(m => outputFormat.replace(/{value}/g, m)).join('<br>');
                    formattedResult = `${first} <details><summary>...</summary>${collapsed}</details>${last}`;
                } else {
                    formattedResult = "No matches found.";
                }
                break;
            default:
                formattedResult = "No matches found.";
                break;
        }

        console.log(formattedResult);


        formattedResult = formattedResult.replace(/\n/g, '<br>');

        // Return a table row with the config name and the formatted result
        return `<tr><td>${config.name}</td><td>${formattedResult}</td></tr>`;
    });

    // Wrap rows in table tags
    return `<table border="1" style="width:100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Output</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows.join('')}
                </tbody>
            </table>`;
}



// This method is called when your extension is deactivated
export function deactivate() {
    if (currentPanel) {
        currentPanel.dispose();
    }
}
