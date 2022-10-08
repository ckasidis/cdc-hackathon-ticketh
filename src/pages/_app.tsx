// src/pages/_app.tsx
import { theme } from '@chakra-ui/pro-theme';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import { loggerLink } from '@trpc/client/links/loggerLink';
import { withTRPC } from '@trpc/next';
import { Session } from 'next-auth';
import { SessionProvider } from 'next-auth/react';
import type { AppType } from 'next/dist/shared/lib/utils';
import superjson from 'superjson';
import {
	createClient,
	configureChains,
	defaultChains,
	WagmiConfig,
} from 'wagmi';
import { publicProvider } from 'wagmi/providers/public';
import type { AppRouter } from '../server/router';

const { provider, webSocketProvider } = configureChains(defaultChains, [
	publicProvider(),
]);

const client = createClient({
	provider,
	webSocketProvider,
	autoConnect: true,
});

const myTheme = extendTheme(
	{
		colors: { ...theme.colors, brand: theme.colors.purple },
	},
	theme
);

const MyApp: AppType<{ session: Session }> = ({
	Component,
	pageProps: { session, ...pageProps },
}) => {
	return (
		<WagmiConfig client={client}>
			<SessionProvider session={session}>
				<ChakraProvider theme={myTheme}>
					<Component {...pageProps} />
				</ChakraProvider>
			</SessionProvider>
		</WagmiConfig>
	);
};

const getBaseUrl = () => {
	if (typeof window !== 'undefined') return ''; // browser should use relative url
	if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`; // SSR should use vercel url
	return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

export default withTRPC<AppRouter>({
	config() {
		/**
		 * If you want to use SSR, you need to use the server's full URL
		 * @link https://trpc.io/docs/ssr
		 */
		const url = `${getBaseUrl()}/api/trpc`;

		return {
			links: [
				loggerLink({
					enabled: (opts) =>
						process.env.NODE_ENV === 'development' ||
						(opts.direction === 'down' && opts.result instanceof Error),
				}),
				httpBatchLink({ url }),
			],
			url,
			transformer: superjson,
			/**
			 * @link https://react-query.tanstack.com/reference/QueryClient
			 */
			// queryClientConfig: { defaultOptions: { queries: { staleTime: 60 } } },

			// To use SSR properly you need to forward the client's headers to the server
			// headers: () => {
			//   if (ctx?.req) {
			//     const headers = ctx?.req?.headers;
			//     delete headers?.connection;
			//     return {
			//       ...headers,
			//       "x-ssr": "1",
			//     };
			//   }
			//   return {};
			// }
		};
	},
	/**
	 * @link https://trpc.io/docs/ssr
	 */
	ssr: false,
})(MyApp);
