// src/server/router/index.ts
import { createRouter } from './context';
import superjson from 'superjson';
import { myContractsRouter } from './my-contracts';

export const appRouter = createRouter()
	.transformer(superjson)
	.merge('my-contracts.', myContractsRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
