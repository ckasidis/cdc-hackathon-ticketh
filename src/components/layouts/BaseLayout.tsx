import { Box, Button, Container, Flex, HStack, Stack } from '@chakra-ui/react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { PropsWithChildren } from 'react';
import Logo from '../Logo';

const BaseLayout: React.FC<PropsWithChildren> = ({ children }) => {
	const router = useRouter();
	const { status } = useSession();

	return (
		<Flex minH="100vh" bg="bg-canvas">
			<Stack spacing={0} flex={1}>
				<HStack justifyContent="space-between" bg="bg-accent" py="4" px="6">
					<Logo />
					<HStack spacing={4}>
						<Button
							onClick={() => router.push('/events')}
							variant="link-on-accent"
						>
							Events
						</Button>
						{status === 'authenticated' ? (
							<Button
								onClick={() => router.push('/dashboard')}
								variant="link-on-accent"
							>
								Dashboard
							</Button>
						) : (
							<Button
								onClick={() => router.push('/signin')}
								variant="link-on-accent"
							>
								Sign in
							</Button>
						)}
					</HStack>
				</HStack>
				<Box as="main" flex={1}>
					<Container maxW={{ base: 'xs', sm: 'sm' }} py={{ base: 8, md: 14 }}>
						{children}
					</Container>
				</Box>
			</Stack>
		</Flex>
	);
};

export default BaseLayout;
