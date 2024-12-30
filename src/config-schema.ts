import {z} from 'zod';

const upstreamSchema = z.object({
    id: z.string(),
    url: z.string(),
});

const headerSchema = z.object({
    key: z.string(),
    value: z.string(),
});

const ruleSchema = z.object({
    path: z.string(),
    upstreams: z.array(z.string()),
});

const serverConfigSchema = z.object({
    listen: z.number(),
    workers: z.number().optional(),
    upstreams: z.array(upstreamSchema),
    headers: z.array(headerSchema).optional(),
    rules: z.array(ruleSchema),
});

export const rootConfigSchema = z.object({
    server: serverConfigSchema,
});

export type configSchemaType = z.infer<typeof rootConfigSchema>;