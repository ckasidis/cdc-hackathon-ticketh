import {
	Alert,
	AlertDescription,
	AlertIcon,
	Button,
	Center,
	Heading,
	HStack,
	IconButton,
	Spinner,
	Stack,
	Table,
	TableContainer,
	Tbody,
	Td,
	Text,
	Th,
	Thead,
	Tr,
	useDisclosure,
} from '@chakra-ui/react';
import { GetServerSideProps, NextPage } from 'next';
import { User } from 'next-auth';
import Head from 'next/head';
import { useState } from 'react';
import { FiEdit } from 'react-icons/fi';
import { getServerAuthSession } from '../../server/common/get-server-auth-session';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import UpdateContractModal from '../../components/modals/UpdateContractModal';
import { trpc } from '../../utils/trpc';
import { truncateString } from '../../utils/truncate';
import DeployContractModal from '../../components/modals/DeployContractModal';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const session = await getServerAuthSession(ctx);
	if (!session) {
		return {
			redirect: {
				destination: '/signin',
				permanent: false,
			},
		};
	}

	return {
		props: {
			user: session.user,
		},
	};
};

interface MyContractsPageProps {
	user: User;
}

const MyContractsPage: NextPage<MyContractsPageProps> = ({ user }) => {
	const updateContract = useDisclosure();
	const deployContract = useDisclosure();

	const {
		data: myContracts,
		isLoading: myContractsIsLoading,
		isError: myContractsIsError,
	} = trpc.useQuery(['my-contracts.read-contracts']);

	const [contractToUpdate, setContractToUpdate] = useState('');

	return (
		<>
			<Head>
				<title>Contracts</title>
			</Head>
			<UpdateContractModal
				isOpen={updateContract.isOpen}
				onClose={updateContract.onClose}
				address={contractToUpdate}
			/>
			<DeployContractModal
				walletAddress={user.address}
				isOpen={deployContract.isOpen}
				onClose={deployContract.onClose}
			/>
			<DashboardLayout>
				<Stack spacing={8}>
					<HStack justifyContent="space-between">
						<Heading as="h1" size="xs">
							My Contracts
						</Heading>
						<Button size="sm" variant="primary" onClick={deployContract.onOpen}>
							New Contract
						</Button>
					</HStack>
					{myContractsIsLoading ? (
						<Center>
							<Spinner />
						</Center>
					) : myContractsIsError ? (
						<Alert>
							<AlertIcon />
							<AlertDescription>Error fetching contracts</AlertDescription>
						</Alert>
					) : myContracts?.length ? (
						<TableContainer>
							<Table size="sm">
								<Thead>
									<Tr>
										<Th>
											<Text></Text>
										</Th>
										<Th>
											<Text>Address</Text>
										</Th>
										<Th>
											<Text>Label</Text>
										</Th>
										<Th>
											<Text>Linked Event</Text>
										</Th>
										<Th>
											<Text>Created On</Text>
										</Th>
									</Tr>
								</Thead>
								<Tbody>
									{myContracts?.map((contract) => (
										<Tr key={contract.address}>
											<Td>
												<IconButton
													onClick={() => {
														setContractToUpdate(contract.address);
														updateContract.onOpen();
													}}
													aria-label="update contract"
													icon={<FiEdit />}
													variant="link"
													size="xs"
												/>
											</Td>
											<Td>
												<Text fontSize="xs" color="muted">
													{truncateString(contract.address)}
												</Text>
											</Td>
											<Td>
												<Text fontSize="xs" color="muted">
													{contract.label}
												</Text>
											</Td>
											<Td>
												<Text fontSize="xs" color="muted">
													{contract.event?.name || '-'}
												</Text>
											</Td>
											<Td>
												<Text fontSize="xs" color="muted">
													{contract.createdAt.toLocaleDateString()}
												</Text>
											</Td>
										</Tr>
									))}
								</Tbody>
							</Table>
						</TableContainer>
					) : (
						<Alert status="info">
							<AlertIcon />
							<AlertDescription>
								No contracts detected, create one now!
							</AlertDescription>
						</Alert>
					)}
				</Stack>
			</DashboardLayout>
		</>
	);
};

export default MyContractsPage;
