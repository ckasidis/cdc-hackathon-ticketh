// src/server/router/index.ts
import { createRouter } from './context';
import superjson from 'superjson';
import { myContractsRouter } from './my-contracts';
import { eventsRouter } from './events';
import { myEventsRouter } from './my-events';
import { myImageRouter } from './my-image'

export const appRouter = createRouter()
	.transformer(superjson)
	.merge('my-contracts.', myContractsRouter)
	.merge('events.', eventsRouter)
	.merge('my-events.', myEventsRouter)
	.merge('my-image.', myImageRouter)

// export type definition of API
export type AppRouter = typeof appRouter;
