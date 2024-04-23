# Quantum Espresso Live Preview Extension

Author by Jingyi Zhuang (@jappoker, [jz2907@columbia.edu](mailto:jz2907@columbia.edu))

This extension offers a live preview for Quantum Espresso output files with the `.out` extension. Users can view formatted data extracted through customizable regular expressions defined on an integrated settings page.

## Installation

### Method 1: Marketplace Installation

TBD


### Method 2: Install from GitHub Release

1. Go to the [GitHub Releases](https://github.com/jappoker/vscode_quantum_espresso_io_highlight/releases) page for this extension.
2. Download the latest release `.vsix` file from the assets.
3. Open **Visual Studio Code**.
4. Navigate to the **Extensions** view.
5. Click the `...` at the top of the sidebar, and select `Install from VSIX...` from the dropdown.
6. Locate the downloaded `.vsix` file and select it.
7. The extension will be installed into Visual Studio Code.
8. Reload Visual Studio Code to activate the extension.

### Method 3: Manual Installation
To install the extension, follow these steps:

1. Clone or download this repository.
2. Open the project in Visual Studio Code.
3. Press `Ctrl + Shift + B` to build the extension.
4. Press `F5` to open a new window with the extension loaded.
5. Activate the extension using the command palette.

## Usage

Once the extension is installed, you can use it as follows:

1. Open a Quantum Espresso output file (with the `.out` extension) in Visual Studio Code.
2. Press `Ctrl + Shift + P` (Windows/Linux) or `Cmd + Shift + P` (Mac) to open the command palette.
3. Enter `QE: Open Live Preview` to activate the live preview feature.

![Screenshot](https://github.com/jappoker/vscode_quantum_espresso_io_highlight/blob/main/qe-preview/screenshot.png?raw=true)

## Customization

### Customizing Regex Matching Rules (Preferred)

You can customize the regex matching rules by editing the settings in a 'Edit Pattern Setting` window. To do this, follow these steps:

1. Press `Ctrl + Shift + P` (Windows/Linux) or `Cmd + Shift + P` (Mac) to open the command palette.
2. Enter `QE: Edit Pattern Settings for QE Live Preview` to edit the settings.

![Screenshot](https://github.com/jappoker/vscode_quantum_espresso_io_highlight/blob/main/qe-preview/screenshot-240423.png?raw=true)

The settings follow this format:

```json
{
    "name": "Name of the Rule",
    "regex": "Regular Expression to Match",
    "renderType": "Type of Rendering (first, last, all)",
    "outputFormat": "Format for Output (with {value} as placeholder)"
}
```

To add a new rule, click on the `Add Pattern` button and fill in the fields with the desired values. To remove a rule, click on the `Delete` button next to the rule you want to delete.

**New in Version 0.0.2**: The {value} placeholder now features a click-to-copy functionality. Simply click on {value} to copy it to your clipboard for easy use.

### Example Rules

```json
{
    "name": "Job Done?",
    "regex": "(JOB DONE\\.)",
    "renderType": "last",
    "outputFormat": "{value}"
},
{
    "name": "Unit Cell Volume",
    "regex": "\\bunit-cell volume\\s+=\\s+([\\d.]+)\\s*\\(a\\.u\\.\\)\\^3",
    "renderType": "last",
    "outputFormat": "{value} (a.u.)^3"
},
{
    "name": "Total Energy",
    "regex": "!\\s*total\\s+energy\\s+=\\s+(-?\\d+\\.\\d+)\\s+Ry",
    "renderType": "all",
    "outputFormat": "{value} Ry"
},
{
    "name": "Total Stress",
    "regex": "\\s*total\\s+stress\\s+\\(Ry\\/bohr\\*\\*3\\)\\s+\\(kbar\\)\\s+P=\\s+(-?\\d+\\.\\d+)\\s*",
    "renderType": "last",
    "outputFormat": "{value} kbar"
},
{
    "name": "LDA+U Parameters",
    "regex": "--- enter write_ns ---\\s*([\\s\\S]*?)\\s*--- exit write_ns ---",
    "renderType": "last",
    "outputFormat": "{value}"
},
{
    "name": "LDA+U Parameters (>7.1)",
    "regex": "End of self-consistent calculation\\S*\\s+=================== HUBBARD OCCUPATIONS ===================\\s*([\\s\\S]*?)\\s*------ SPIN UP --------",
    "renderType": "last",
    "outputFormat": "{value}"
},
{
    "name": "Final Cell",
    "regex": "Begin final coordinates\\s*([\\s\\S]*?)\\s*End final coordinates",
    "renderType": "last",
    "outputFormat": "{value}"
}
```

### Customizing Regex Matching Rules (Outdated)

**Note**: This method is outdated and will be removed in future versions. Please use the new method described above.

<del>

You can customize the regex matching rules by modifying the JSON file located at `/resources/regexPatterns.json`. The JSON file should follow this format:

```json
{
    "name": "Name of the Rule",
    "regex": "Regular Expression to Match",
    "renderType": "Type of Rendering (first, last, all)",
    "outputFormat": "Format for Output (with {value} as placeholder)"
}
```

Example:

```json
{
    "name": "Unit Cell Volume",
    "regex": "\\bunit-cell volume\\s+=\\s+([\\d.]+)\\s*\\(a\\.u\\.\\)\\^3",
    "renderType": "last",
    "outputFormat": "{value} (a.u.)^3"
}
```
</del>


## License

This extension is licensed under the [MIT License](https://raw.githubusercontent.com/jappoker/vscode_quantum_espresso_io_highlight/main/qe-preview/LICENSE).