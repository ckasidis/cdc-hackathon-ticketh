// src/server/router/index.ts
import { createRouter } from './context';
import superjson from 'superjson';
import { myContractsRouter } from './my-contracts';
import { eventsRouter } from './events';
import { myEventsRouter } from './my-events';
import { myProfileRouter } from './my-profile';
import { usersRouter } from './usersRouter';

export const appRouter = createRouter()
	.transformer(superjson)
	.merge('my-contracts.', myContractsRouter)
	.merge('events.', eventsRouter)
	.merge('my-events.', myEventsRouter)
	.merge('users.', usersRouter)
	.merge('my-profile.', myProfileRouter);

// export type definition of API
export type AppRouter = typeof appRouter;
