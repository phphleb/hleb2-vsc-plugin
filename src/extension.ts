import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import {registerRouteAddressProvider} from "./routeAddressProvider";
import {registerRoutePrefixProvider} from "./routePrefixProvider";
import {registerDebugInfoProvider} from "./registerDebugInfoProvider";
import {registerGlobalPathProvider} from "./registerGlobalPathProvider";

export function activate(context: vscode.ExtensionContext) {
	console.log('The extension for the HLEB2 framework is activated.');

	const workspaceRoots = vscode.workspace.workspaceFolders;
	let root: string | null = workspaceRoots ? workspaceRoots[0].uri.fsPath : null;

	if (root && fs.existsSync(path.join(root, 'app', 'Bootstrap', 'BaseContainer.php'))) {
		registerRouteAddressProvider(context);
		registerRoutePrefixProvider(context);
		registerGlobalPathProvider(context, root);
	}

	registerDebugInfoProvider(context);
}

export function deactivate() {}
