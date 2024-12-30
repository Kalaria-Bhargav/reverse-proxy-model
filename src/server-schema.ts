import { request } from 'http';
import {z} from 'zod';

export const workerMessageSchema = z.object({ 
    requestType: z.enum(['HTTP', 'HTTPS']),
    Headers: z.any(),
    body: z.any(),
    url: z.string(),
});

export const workerMessageReplySchema = z.object({
    data: z.string().optional(),
    error: z.string().optional(),
    statusCode: z.enum(['200', '404', '500']),
});

export type workerMessageType = z.infer<typeof workerMessageSchema>;
export type workerMessageReplyType = z.infer<typeof workerMessageReplySchema>;
