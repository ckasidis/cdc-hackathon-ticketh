import { z } from 'zod';
import { createRouter } from './context';

export const eventsRouter = createRouter()
	.query('read-event', {
		input: z.object({
			id: z.string({ required_error: 'ID is required' }),
		}),
		async resolve({ input, ctx }) {
			return await ctx.prisma.event.findUnique({
				where: {
					id: input.id,
				},
				include: {
					contracts: {
						select: {
							address: true,
						},
					},
				},
			});
		},
	})
	.query('read-events', {
		async resolve({ ctx }) {
			return await ctx.prisma.event.findMany({
				orderBy: {
					createdAt: 'desc',
				},
			});
		},
	});
