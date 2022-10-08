import * as trpc from '@trpc/server';
import { z } from 'zod';
import { createProtectedRouter } from './context';

export const myContractsRouter = createProtectedRouter()
	.mutation('create-contract', {
		input: z.object({
			address: z.string({ required_error: 'address is required' }),
			contentId: z.string({ required_error: 'CID is required' }),
			label: z.string({ required_error: 'label is required' }),
			eventId: z.string().nullish(),
		}),
		async resolve({ input, ctx }) {
			return await ctx.prisma.contract.create({
				data: {
					address: input.address,
					contentId: input.contentId,
					label: input.label,
					eventId: input.eventId,
					userId: ctx.session.user.id,
				},
			});
		},
	})
	.mutation('update-contract', {
		input: z.object({
			address: z.string({ required_error: 'address is required' }),
			label: z.string({ required_error: 'label is required' }),
		}),
		async resolve({ input, ctx }) {
			const data = await ctx.prisma.contract.findUnique({
				where: {
					address: input.address,
				},
			});

			if (!data) {
				throw new trpc.TRPCError({ code: 'NOT_FOUND' });
			}

			if (data.userId != ctx.session.user.id) {
				throw new trpc.TRPCError({ code: 'UNAUTHORIZED' });
			}

			return await ctx.prisma.contract.update({
				where: {
					address: input.address,
				},
				data: {
					label: input.label,
				},
			});
		},
	})
	.query('read-contract', {
		input: z.object({
			address: z.string({ required_error: 'address is required' }),
		}),
		async resolve({ input, ctx }) {
			const data = await ctx.prisma.contract.findUnique({
				where: {
					address: input.address,
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
	.query('read-contracts', {
		async resolve({ ctx }) {
			return await ctx.prisma.contract.findMany({
				where: {
					userId: ctx.session.user.id,
				},
				orderBy: {
					createdAt: 'desc',
				},
				include: {
					event: {
						select: {
							name: true,
						},
					},
				},
			});
		},
	});
