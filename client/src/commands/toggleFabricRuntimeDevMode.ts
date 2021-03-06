/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

import * as vscode from 'vscode';
import { VSCodeBlockchainOutputAdapter } from '../logging/VSCodeBlockchainOutputAdapter';
import { FabricRuntime } from '../fabric/FabricRuntime';
import { FabricConnectionManager } from '../fabric/FabricConnectionManager';
import { FabricRuntimeManager } from '../fabric/FabricRuntimeManager';
import { LogType } from '../logging/OutputAdapter';
import { ExtensionCommands } from '../../ExtensionCommands';

export async function toggleFabricRuntimeDevMode(): Promise<void> {
    const outputAdapter: VSCodeBlockchainOutputAdapter = VSCodeBlockchainOutputAdapter.instance();
    outputAdapter.log(LogType.INFO, undefined, 'toggleFabricRuntimeDevMode');
    const runtime: FabricRuntime = FabricRuntimeManager.instance().getRuntime();

    const oldDevelopmentMode: boolean = runtime.isDevelopmentMode();
    const newDevelopmentMode: boolean = !oldDevelopmentMode;

    if (FabricConnectionManager.instance().getConnection()) {
        // Disconnect if connected
        await vscode.commands.executeCommand(ExtensionCommands.DISCONNECT);
    }

    await runtime.setDevelopmentMode(newDevelopmentMode);
    const running: boolean = await runtime.isRunning();
    if (running) {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'IBM Blockchain Platform Extension',
            cancellable: false
        }, async (progress: vscode.Progress<{ message: string }>) => {
            progress.report({ message: `Restarting Fabric runtime ${runtime.getName()}` });
            await runtime.restart(outputAdapter);
        });
    }

    await vscode.commands.executeCommand(ExtensionCommands.REFRESH_LOCAL_OPS);
    outputAdapter.log(LogType.SUCCESS, 'Successfully toggled development mode', 'Successfully toggled development mode');

}
