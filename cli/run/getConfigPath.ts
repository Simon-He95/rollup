import { promises as fs } from 'fs';
import { resolve } from 'path';
import { cwd } from 'process';
import { handleError } from '../logging';

const DEFAULT_CONFIG_BASE = 'rollup.config';

export async function getConfigPath(commandConfig: string | true): Promise<string> {
	if (commandConfig === true) {
		return resolve(await findConfigFileNameInCwd());
	}
	if (commandConfig.slice(0, 5) === 'node:') {
		const pkgName = commandConfig.slice(5);
		try {
			return require.resolve(`rollup-config-${pkgName}`, { paths: [cwd()] });
		} catch {
			try {
				return require.resolve(pkgName, { paths: [cwd()] });
			} catch (err: any) {
				if (err.code === 'MODULE_NOT_FOUND') {
					handleError({
						code: 'MISSING_EXTERNAL_CONFIG',
						message: `Could not resolve config file "${commandConfig}"`
					});
				}
				throw err;
			}
		}
	}
	return resolve(commandConfig);
}

async function findConfigFileNameInCwd(): Promise<string> {
	const filesInWorkingDir = new Set(await fs.readdir(cwd()));
	for (const extension of ['mjs', 'cjs', 'ts']) {
		const fileName = `${DEFAULT_CONFIG_BASE}.${extension}`;
		if (filesInWorkingDir.has(fileName)) return fileName;
	}
	return `${DEFAULT_CONFIG_BASE}.js`;
}
