import { z } from 'zod';
import { createRouter } from './context';

export const usersRouter = createRouter().query('read-user', {
	input: z.object({
		id: z.string({ required_error: 'ID is required' }),
	}),
	async resolve({ input, ctx }) {
		return await ctx.prisma.user.findUnique({
			where: {
				id: input.id,
			},
		});
	},
});
