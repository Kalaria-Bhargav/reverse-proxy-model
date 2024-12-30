import cluster, {Worker} from 'node:cluster';
import http from 'node:http';
import { rootConfigSchema, configSchemaType } from './config-schema';
import { send } from 'node:process';
import  {workerMessageType, workerMessageSchema, workerMessageReplyType, workerMessageReplySchema} from './server-schema';
import { url } from 'node:inspector';

interface createServerConfig {
    port: number;
    workerCount: number;
    config: configSchemaType;
}

export async function createServer(config: createServerConfig){
    const {workerCount} = config;
    const WORKER_POOL:Worker[] = [];
    
    if(cluster.isPrimary){
        console.log(`Master process is up`);

        for(let i = 0; i < workerCount; i++){
            const w = cluster.fork({config: JSON.stringify(config.config)});
            WORKER_POOL.push(w);
            console.log(`master Process forked worker ${i}`);
        }

        const server = http.createServer( (req, res) =>{
            const index = Math.floor(Math.random() * WORKER_POOL.length);

            if(!cluster.workers) throw new Error('No workers found');

            const worker: Worker = WORKER_POOL[index];

            const payload : workerMessageType = {
                requestType: 'HTTP',
                Headers: req.headers,
                body: null,
                url: req.url as string
            };

            worker.send( JSON.stringify(payload) );
            worker.on('message', async(message: string) => {
                const reply: workerMessageReplyType = await workerMessageReplySchema.parseAsync(JSON.parse(message));
                if(reply.error){
                    res.statusCode = parseInt(reply.statusCode);
                    res.end(reply.error);
                    return;
                }else{
                    res.statusCode = parseInt(reply.statusCode);
                    res.end(reply.data);
                    return;
                }
            });
        });
        
        server.listen(config.port, () => {
            console.log(`Reverse proxy Server is running on port ${config.port}`);
        });
        
    }else{
        console.log('worker Node!!!');
        const config = await rootConfigSchema.parseAsync(
            JSON.parse(`${process.env.config}`)
        );

        process.on('message', (message : string) => {
            // console.log("WORKER:: ", message);
            const messageValidated = workerMessageSchema.parse(JSON.parse(message));
            const reqURL = messageValidated.url;

            // finding the best fittable rule
            const rule = config.server.rules.find( rule => reqURL.startsWith(rule.path));
            console.log("Rules:: " + " " + rule);
            if(!rule){
                const reply : workerMessageReplyType = {error: 'No rule found', statusCode: '404'};
                if (process.send) {
                    return process.send(JSON.stringify(reply));
                }
            }

            // finding the upstream according to the rule
            const upstreamID = rule?.upstreams[0];
            const upstream = config.server.upstreams.find( up => up.id === upstreamID);
            if(!upstream){
                const reply : workerMessageReplyType = {error: 'No upstream found', statusCode: '500'};
                if (process.send) {
                    return process.send(JSON.stringify(reply));
                }
            }

            // if we are able to find the upstreams(proxy servers) then forward the request there.
            const request = http.request({host: upstream?.url, path: reqURL}, (proxyRes) => {
                // console.log(proxyRes);
                let body = '';
                proxyRes.on('data', (chunk) => {
                    body += chunk;
                });
                proxyRes.on('end', () => {
                    const reply : workerMessageReplyType = {data: body, statusCode: '200'};
                    if (process.send) {
                        return process.send(JSON.stringify(reply));
                    }
                });
            });
            request.end();
        });


    }

}