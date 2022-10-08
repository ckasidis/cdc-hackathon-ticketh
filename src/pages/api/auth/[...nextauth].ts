import CredentialsProvider from 'next-auth/providers/credentials';
import NextAuth, { NextAuthOptions } from 'next-auth';
import Moralis from 'moralis';
import { prisma } from '../../../server/db/client';
import { env } from '../../../env/server.mjs';

export const authOptions: NextAuthOptions = {
	providers: [
		CredentialsProvider({
			name: 'MoralisAuth',
			credentials: {
				message: {
					label: 'Message',
					type: 'text',
					placeholder: '0x0',
				},
				signature: {
					label: 'Signature',
					type: 'text',
					placeholder: '0x0',
				},
			},
			async authorize(credentials) {
				try {
					if (!credentials) return null;

					// "message" and "signature" are needed for authorization
					// we described them in "credentials" above
					const { message, signature } = credentials;

					await Moralis.start({ apiKey: env.MORALIS_API_KEY });

					const { address, profileId: id } = (
						await Moralis.Auth.verify({ message, signature, network: 'evm' })
					).raw;

					// store new user in database
					const data = await prisma.user.findUnique({
						where: {
							id,
						},
					});
					if (!data) {
						await prisma.user.create({
							data: {
								id,
							},
						});
					}

					// returning the user object and creating a session
					const user = { address, id, signature };
					return user;
				} catch (e) {
					console.error(e);
					return null;
				}
			},
		}),
	],
	// adding user info to the user session object
	callbacks: {
		async jwt({ token, user }) {
			user && (token.user = user);
			return token;
		},
		async session({ session, token }) {
			session.user = token.user;
			return session;
		},
	},
};

export default NextAuth(authOptions);
