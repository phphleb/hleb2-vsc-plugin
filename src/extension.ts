import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {registerRouteAddressProvider} from "./routeAddressProvider";
import {registerRoutePrefixProvider} from "./routePrefixProvider";
import {registerDebugInfoProvider} from "./registerDebugInfoProvider";
import {registerGlobalPathProvider} from "./registerGlobalPathProvider";
import {registerGlobalFilesLinkProvider} from "./registerGlobalFilesLinkProvider";
import {registerViewFunctionProvider} from "./registerViewFunctionProvider";

export function activate(context: vscode.ExtensionContext) {
	console.log('HLEB2 DEBUG INFO The extension for the HLEB2 framework is activated.');

	const workspaceRoots = vscode.workspace.workspaceFolders;
	let root: string | null = workspaceRoots ? workspaceRoots[0].uri.fsPath : null;

	if (root && fs.existsSync(path.join(root, 'app', 'Bootstrap', 'BaseContainer.php'))) {
		console.log('HLEB2 DEBUG INFO The current project is defined as being based on the HLEB2 framework.');

		registerRouteAddressProvider(context);
		registerRoutePrefixProvider(context);
		registerGlobalPathProvider(context, root);
		registerGlobalFilesLinkProvider(context, root);
		registerViewFunctionProvider(context, root);
	}

	registerDebugInfoProvider(context);
}

export function deactivate() {}
