import { Box, Container, Flex, Stack, useDisclosure } from '@chakra-ui/react';
import { PropsWithChildren } from 'react';
import MobileHeader from '../navigation/MobileHeader';
import Sidebar from '../navigation/Sidebar';

const DashboardLayout: React.FC<PropsWithChildren> = ({ children }) => {
	const { isOpen, onOpen, onClose } = useDisclosure();

	return (
		<>
			<Flex display={{ base: 'none', md: 'flex' }} minH="100vh" bg="bg-canvas">
				<Sidebar />
				<Box as="main" flex={1}>
					<Container maxW={{ base: 'md', lg: '2xl' }} py={{ base: 8, md: 14 }}>
						{children}
					</Container>
				</Box>
			</Flex>
			<Flex
				display={{ base: 'flex', md: 'none' }}
				minH="100vh"
				bg="'bg-canvas'"
			>
				{isOpen ? (
					<Sidebar onClose={onClose} flex={1} />
				) : (
					<Stack spacing={0} flex={1}>
						<MobileHeader onOpen={onOpen} />
						<Box as="main" flex={1}>
							<Container
								maxW={{ base: 'xs', sm: 'sm' }}
								py={{ base: 8, md: 14 }}
							>
								{children}
							</Container>
						</Box>
					</Stack>
				)}
			</Flex>
		</>
	);
};

export default DashboardLayout;
