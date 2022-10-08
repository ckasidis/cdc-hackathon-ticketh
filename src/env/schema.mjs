// @ts-check
import { z } from 'zod';

/**
 * Specify your server-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
	DATABASE_URL: z.string().url(),
	NEXTAUTH_URL: z.string().url(),
	NEXTAUTH_SECRET: z.string(),
	APP_DOMAIN: z.string(),
	MORALIS_API_KEY: z.string(),
	NODE_ENV: z.enum(['development', 'test', 'production']),

    FIREBASE_TYPE: z.string(),
    FIREBASE_PROJECT_ID: z.string(),
    FIREBASE_PRIVATE_KEY_ID: z.string(),
    FIREBASE_PRIVATE_KEY: z.string(),
    FIREBASE_CLIENT_EMAIL: z.string(),
    FIREBASE_CLIENT_ID: z.string(),
    FIREBASE_AUTH_URI: z.string(),
    FIREBASE_TOKEN_URI: z.string(),
    FIREBASE_AUTH_PROVIDER_CERT_URL: z.string(),
    FIREBASE_CLIENT_CERT_URL: z.string(),
    FIREBASE_STORAGEBUCKET: z.string(),
});

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
export const clientSchema = z.object({
	// NEXT_PUBLIC_BAR: z.string(),
});

/**
 * You can't destruct `process.env` as a regular object, so you have to do
 * it manually here. This is because Next.js evaluates this at build time,
 * and only used environment variables are included in the build.
 * @type {{ [k in keyof z.infer<typeof clientSchema>]: z.infer<typeof clientSchema>[k] | undefined }}
 */
export const clientEnv = {
	// NEXT_PUBLIC_BAR: process.env.NEXT_PUBLIC_BAR,
};
