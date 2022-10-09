import * as trpc from '@trpc/server';
import { z } from 'zod';
import { createProtectedRouter } from './context';

export const myEventsRouter = createProtectedRouter()
	.mutation('create-event', {
		input: z.object({
			name: z.string({ required_error: 'name is required' }),
			description: z.string().nullish(),
			status: z.enum(['DRAFT', 'PUBLISHED']),
			image: z.string().nullish(),
		}),
		async resolve({ input, ctx }) {
			return await ctx.prisma.event.create({
				data: {
					name: input.name,
					description: input.description,
					status: input.status,
					image: input.image,
					userId: ctx.session.user.id,
				},
			});
		},
	})
	.mutation('update-event', {
		input: z.object({
			id: z.string({ required_error: 'ID is required' }),
			name: z.string({ required_error: 'name is required' }),
			description: z.string().nullish(),
			status: z.enum(['DRAFT', 'PUBLISHED']),
			image: z.string().nullish(),
			contracts: z
				.object({
					address: z.string(),
				})
				.array()
				.nullish(),
		}),
		async resolve({ input, ctx }) {
			const data = await ctx.prisma.event.findUnique({
				where: {
					id: input.id,
				},
			});

			if (!data) {
				throw new trpc.TRPCError({ code: 'NOT_FOUND' });
			}

			if (data.userId != ctx.session.user.id) {
				throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });
			}

			return await ctx.prisma.event.update({
				where: {
					id: input.id,
				},
				data: {
					name: input.name,
					description: input.description,
					status: input.status,
					image: input.image,
					contracts: {
						set: input.contracts || undefined,
					},
				},
			});
		},
	})
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
						},
					},
				},
			});

			if (!data) {
				throw new trpc.TRPCError({ code: 'NOT_FOUND' });
			}

			if (data.userId != ctx.session.user.id) {
				throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });
			}

			return data;
		},
	})
	.query('read-events', {
		async resolve({ ctx }) {
			return await ctx.prisma.event.findMany({
				where: {
					userId: ctx.session.user.id,
				},
				orderBy: {
					createdAt: 'desc',
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
	});
