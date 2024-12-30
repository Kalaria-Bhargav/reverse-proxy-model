import fs from 'fs';
import {parse} from 'yaml';
import { rootConfigSchema } from './config-schema';

export async function parseYAMLConfigFile(filePath: string) {
    const file = await fs.promises.readFile(filePath, 'utf-8');
    const parsedYaml = parse(file);
    return JSON.stringify(parsedYaml);
}

export async function validateConfig(config: string) {
    const validateConfig = await rootConfigSchema.parseAsync(JSON.parse(config));
    return validateConfig;
}