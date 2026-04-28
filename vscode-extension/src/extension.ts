import * as vscode from "vscode";

const VIEWER_URL = "https://nextpng.org/viewer";

function encodeSharePayload(source: string): string {
  const payload = Buffer.from(source, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `n1.${payload}`;
}

export function activate(context: vscode.ExtensionContext) {
  const command = vscode.commands.registerCommand("nextpng.openViewer", async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "npng") {
      await vscode.window.showWarningMessage("Open a .npng file before launching the nextPNG viewer.");
      return;
    }

    const source = editor.document.getText();
    const uri = vscode.Uri.parse(`${VIEWER_URL}#npng=${encodeSharePayload(source)}`);
    await vscode.env.openExternal(uri);
  });

  context.subscriptions.push(command);
}

export function deactivate() {}
