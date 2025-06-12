import * as vscode from "vscode";
import { createHash } from "node:crypto";

export function activate(context: vscode.ExtensionContext) {
    const getLines = (selection: vscode.Selection) =>
        selection.isEmpty
            ? [selection.anchor.line, 1]
            : [selection.start.line, selection.end.line - selection.start.line + 1];
    
    function getProtectionHash(line: number, lines = 1) {
        const hash = createHash('md5');
        const protectedCode = Array.from({ length: lines }, (_, i) => 
            vscode.window.activeTextEditor?.document.lineAt(line + i).text.trim()
        ).join("\n");
        hash.update(protectedCode);
        return hash.digest('base64');
    }

    const selectionCommand = vscode.commands.registerCommand(
        "eslint-protect.selected",
        () => {
            const selections = vscode.window.activeTextEditor?.selections ||
                [vscode.window.activeTextEditor?.selection];
            const editor = vscode.window.activeTextEditor;
            selections.forEach((selection) => {
                if (!selection || !editor?.document) {
                    return;
                }
                const [line, lines] = getLines(selection);
                const hash = getProtectionHash(line, lines);
                editor.edit((edit) => edit.insert(
                    new vscode.Position(line, 0),
                    `${editor.document.lineAt(line).text.match(/^([\s\t]*)/)?.[1] || ""
                        }//@protection${lines > 1 ? " " + lines : ""} ${hash}\n`
                ));
            });
        }
    );
    context.subscriptions.push(selectionCommand);

    const fileCommand = vscode.commands.registerCommand(
        "eslint-protect.file",
        () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor?.document) {
                return;
            }
            const hash = getProtectionHash(0, editor.document.lineCount);
            editor.edit((edit) => edit.insert(
                new vscode.Position(0, 0),
                `//@protection * ${hash}\n`,
            ));
            console.log('done');
        }
    );
    context.subscriptions.push(fileCommand);
}

export function deactivate() {}
