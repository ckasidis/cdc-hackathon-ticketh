// src/server/router/index.ts
import { createRouter } from './context';
import superjson from 'superjson';
import { myContractsRouter } from './my-contracts';
import { eventsRouter } from './events';

export const appRouter = createRouter()
	.transformer(superjson)
	.merge('my-contracts.', myContractsRouter)
	.merge('events.', eventsRouter)

// export type definition of API
export type AppRouter = typeof appRouter;
