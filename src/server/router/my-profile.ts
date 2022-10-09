import { z } from 'zod';
import { createProtectedRouter } from './context';

export const myProfileRouter = createProtectedRouter().mutation(
	'update-profile',
	{
		input: z.object({
			image: z.string().nullish(),
			username: z.string().nullish(),
		}),
		async resolve({ input, ctx }) {
			await ctx.prisma.user.update({
				where: {
					id: ctx.session.user.id,
				},
				data: {
					username: input.username,
					image: input.image,
				},
			});
		},
	}
);
