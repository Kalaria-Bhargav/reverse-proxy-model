import {program} from 'commander';
import {parseYAMLConfigFile, validateConfig} from './configParser'
import os from 'node:os';
import {createServer} from './createServer';

async function main(){
    // console.log('main Start:')
    program.option('--config <path>');
    program.parse();

    const options = program.opts();

    if(options.config){
        const validatedConfig = await validateConfig(
            await parseYAMLConfigFile(options.config)
        );
        await createServer({
            port: validatedConfig.server.listen, 
            workerCount: validatedConfig.server.workers ?? os.cpus().length
            ,config: validatedConfig});
    }
}

main();
