import { z } from 'zod';
import { createRouter } from './context';

export const eventsRouter = createRouter()
	.query('read-event', {
		input: z.object({
			id: z.string({ required_error: 'ID is required' }),
		}),
		async resolve({ input, ctx }) {
			const data = await ctx.prisma.event.findUnique({
				where: {
					id: input.id,
				},
				include: {
					contracts: {
						select: {
							address: true,
							label: true,
						},
					},
					user: {
						select: {
							image: true,
							username: true,
						},
					},
				},
			});

			if (data?.status === 'PUBLISHED') {
				return data;
			}

			return data?.userId === ctx.session?.user.id ? data : null;
		},
	})
	.query('read-events', {
		async resolve({ ctx }) {
			return await ctx.prisma.event.findMany({
				where: {
					status: 'PUBLISHED',
				},
				orderBy: {
					createdAt: 'desc',
				},
				include: {
					user: {
						select: {
							image: true,
							username: true,
						},
					},
				},
			});
		},
	});
