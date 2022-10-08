import { Box, Container, Flex } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';

const BaseLayout: React.FC<PropsWithChildren> = ({ children }) => {
	return (
		<Flex bg="bg-canvas" minH="100vh">
			<Box flex={1}>
				<Container
					maxW={{ base: 'xs', sm: 'md', md: 'lg', lg: '2xl' }}
					py={{ base: 8, md: 14 }}
				>
					{children}
				</Container>
			</Box>
		</Flex>
	);
};

export default BaseLayout;
