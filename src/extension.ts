import * as vscode from 'vscode';
import {registerRouteAddressProvider} from "./routeAddressProvider";
import {registerRoutePrefixProvider} from "./routePrefixProvider";
import {registerDebugInfoProvider} from "./registerDebugInfoProvider";

export function activate(context: vscode.ExtensionContext) {
	console.log('The extension for the HLEB2 framework is activated.');

	registerRouteAddressProvider(context);
	registerRoutePrefixProvider(context);
	registerDebugInfoProvider(context);
}

export function deactivate() {}
