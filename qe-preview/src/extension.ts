import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Console } from 'console';

let currentPanel: vscode.WebviewPanel | undefined = undefined;
let regexConfigs: any[] = [];
let defaultRegexConfigs: any[] = [];
let htmlPath: string = '';
let settingsHtmlPath: string = '';
let jsonPath: string = '';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {
    jsonPath = context.asAbsolutePath(path.join('resources', 'regexPatterns.json'))
    htmlPath = context.asAbsolutePath(path.join('resources', 'webViewContent.html'))
    settingsHtmlPath = context.asAbsolutePath(path.join('resources', 'settingsViewContent.html'))

    defaultRegexConfigs = loadRegexConfigurations(); // Load regex configurations from JSON file
    regexConfigs = getPatternSettings(); // Load regex configurations from settings

    let settingsDisposable = vscode.commands.registerCommand('extension.editSettings', function () {
        const panel = vscode.window.createWebviewPanel(
            'settingsEditor', // Identifies the type of the webview
            'Settings Editor', // Title of the panel displayed to the user
            vscode.ViewColumn.One, // Editor column to show the new webview panel in.
            { enableScripts: true }
        );

        panel.webview.html = getSettingsViewContent(regexConfigs);
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'save':
                        console.log('Save clicked.');
                        saveSettings(message.data);
                        return;
                    case 'cancel':
                        console.log('Cancel clicked.');
                        panel.dispose();
                        return;
                }
            },
            undefined,
            context.subscriptions
        );
    });

    context.subscriptions.push(settingsDisposable);

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration('extension.patternSettings')) {
                console.log('Pattern settings changed.');
                // Reload regex configurations from settings
                regexConfigs = getPatternSettings();
            }
        })
    );

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

function getSettingsViewContent(regexConfigs: RegexConfig[]): string {
    let htmlTemplate = fs.readFileSync(settingsHtmlPath, 'utf8');
    return htmlTemplate.replace('{{content}}', getSettingsTable(regexConfigs));
}

function getSettingsTable(regexConfigs: RegexConfig[]): string {
    let jsonBlocks = regexConfigs.map((config, index) => {
        return `<tr class="json-block">
    <td>{
        <table>
            <tr><td >"name": </td><td class="wide"><textarea class="name">${config.name}</textarea></td></tr>
            <tr><td >"regex": </td><td class="wide"><textarea class="regex">${config.regex}</textarea></td></tr>
            <tr><td >"renderType": </td><td class="wide">
                <select class="renderType">
                    <option value="first" ${config.renderType === 'first' ? 'selected' : ''}>First</option>
                    <option value="last" ${config.renderType === 'last' ? 'selected' : ''}>Last</option>
                    <option value="all" ${config.renderType === 'all' ? 'selected' : ''}>All</option>
                </select></td></tr>
            <tr><td >"outputFormat": </td><td class="wide"><input type="text" value="${config.outputFormat}" class="outputFormat" /></td></tr>
        </table>
    }</td>
    <td>
        <button class="delete">Delete</button>
    </td>
</tr>`;
    });
    return `${jsonBlocks.join('')}`;
}



function saveSettings(data: RegexConfig[]) {
    const config = vscode.workspace.getConfiguration('qe-preview');

    // Optionally validate data here
    for (const item of data) {
        if (!item.name || !item.regex || !item.renderType || !item.outputFormat) {
            console.error('Invalid data:', item);
            vscode.window.showErrorMessage('One or more entries are invalid.');
            return; // Exit if any data is invalid
        }
    }

    // Update the configuration
    config.update('patternSettings', data, vscode.ConfigurationTarget.Global)
        .then(
            () => vscode.window.showInformationMessage('Settings saved successfully.'),
            error => {
                console.error('Failed to save settings:', error);
                vscode.window.showErrorMessage('Failed to save settings.');
            }
        );
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
    regexConfigs = getPatternSettings();
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

function getPatternSettings() {
    const config = vscode.workspace.getConfiguration('qe-preview');
    const patternSettings = config.get('patternSettings', []);
    return patternSettings;
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

function getActiveFileAndDirectory() {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
        return; // No open text editor
    }

    const filePath = activeEditor.document.uri.fsPath;
    const directoryPath = vscode.Uri.joinPath(activeEditor.document.uri, '..').fsPath;

    return { filePath, directoryPath };
}

// This method is called when your extension is deactivated
export function deactivate() {
    if (currentPanel) {
        currentPanel.dispose();
    }
}
