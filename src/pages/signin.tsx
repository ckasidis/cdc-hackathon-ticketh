import axios from 'axios';
import { Button, Center, Heading, Stack, useToast } from '@chakra-ui/react';
import { signIn } from 'next-auth/react';
import { useAccount, useConnect, useDisconnect, useSignMessage } from 'wagmi';
import { MetaMaskConnector } from 'wagmi/connectors/metaMask';
import BaseLayout from '../components/layouts/BaseLayout';

const SignInPage = () => {
	const toast = useToast();

	const { connectAsync } = useConnect();
	const { disconnectAsync } = useDisconnect();
	const { isConnected } = useAccount();
	const { signMessageAsync } = useSignMessage();

	const handleAuth = async () => {
		try {
			if (isConnected) {
				await disconnectAsync();
			}

			const { account, chain } = await connectAsync({
				connector: new MetaMaskConnector(),
			});

			const userData = { address: account, chain: chain.id, network: 'evm' };

			const {
				data: { message },
			} = await axios.post('/api/auth/request-message', userData, {
				headers: {
					'content-type': 'application/json',
				},
			});

			const signature = await signMessageAsync({ message });

			// redirect user after success authentication to '/dashboard' page
			await signIn('credentials', {
				message,
				signature,
				callbackUrl: '/dashboard',
			});
		} catch {
			toast({
				title: 'Authentication Error',
				status: 'error',
				isClosable: true,
				position: 'bottom-right',
			});
		}
	};
	return (
		<BaseLayout>
			<Stack spacing={5}>
				<Heading as="h1" size={{ base: 'xs', sm: 'sm' }} textAlign="center">
					Web3 Authentication
				</Heading>
				<Button onClick={() => handleAuth()} variant="primary">
					Authenticate via Metamask
				</Button>
			</Stack>
		</BaseLayout>
	);
};

export default SignInPage;
