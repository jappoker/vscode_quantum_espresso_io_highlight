import * as fs from 'fs';
import * as path from 'path';

interface RegexConfig {
    name: string;
    regex: string;
    renderType: string;
    outputFormat: string;
}

// Load regex configurations synchronously
function loadRegexConfigurations(): RegexConfig[] {
    const jsonPath = path.join(__dirname, '../src/regexPatterns.json');
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    return JSON.parse(jsonData);
}

export function extractRelevantData(documentText: string): string {
    const regexConfigs = loadRegexConfigurations();
    let tableRows = regexConfigs.map(config => {
        const regex = new RegExp(config.regex, 'g');
        const matches = [];
        let match;

        while ((match = regex.exec(documentText)) !== null) {
            matches.push(match[1]);
        }

        // Determine what to show in the second column based on matches
        let formattedResult;
        switch (config.renderType) {
            case 'first':
                formattedResult = matches.length > 0 ? config.outputFormat.replace('{value}', matches[0]) : "No matches found.";
                break;
            case 'last':
                formattedResult = matches.length > 0 ? config.outputFormat.replace('{value}', matches[matches.length - 1]) : "No matches found.";
                break;
            case 'all':
                if (matches.length === 1) {
                    formattedResult = config.outputFormat.replace('{value}', matches[0]);
                } else if (matches.length > 1) {
                    const first = config.outputFormat.replace('{value}', matches[0]);
                    const last = config.outputFormat.replace('{value}', matches[matches.length - 1]);
                    const collapsed = matches.slice(1, matches.length - 1).map(m => config.outputFormat.replace('{value}', m)).join('<br>');
                    formattedResult = `${first} <details><summary>...</summary>${collapsed}</details>${last}`;
                } else {
                    formattedResult = "No matches found.";
                }
                break;
            default:
                formattedResult = "No matches found.";
                break;
        }


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

