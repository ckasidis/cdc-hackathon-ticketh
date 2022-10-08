import {
	Alert,
	AlertDescription,
	AlertIcon,
	Button,
	FormControl,
	FormErrorMessage,
	FormHelperText,
	FormLabel,
	IconButton,
	Input,
	InputGroup,
	InputLeftAddon,
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
	useToast,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useFormik } from 'formik';
import { GetServerSideProps, NextPage } from 'next';
import { User } from 'next-auth';
import Head from 'next/head';
import { useState } from 'react';
import { useQueryClient } from 'react-query';
import { FiEdit } from 'react-icons/fi';
import { useSigner } from 'wagmi';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { getServerAuthSession } from '../../server/common/get-server-auth-session';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import UpdateLabelModal from '../../components/modals/UpdateContractModal';
import { trpc } from '../../utils/trpc';
import { truncateString } from '../../utils/truncate';
import {
	abi,
	bytecode,
} from '../../../hardhat/artifacts/contracts/Ticket.sol/Ticket.json';

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
	const toast = useToast();
	const { isOpen, onOpen, onClose } = useDisclosure();

	const queryClient = useQueryClient();
	const { data: signer } = useSigner();

	const {
		data: myContracts,
		isLoading: myContractsIsLoading,
		isError: myContractsIsError,
	} = trpc.useQuery(['my-contracts.read-contracts']);

	const { mutate: createContract, isLoading: createContractIsLoading } =
		trpc.useMutation('my-contracts.create-contract', {
			onSuccess: () => {
				queryClient.invalidateQueries('my-contracts.read-contracts');
				toast({
					title: 'Deployed new contract successfully',
					status: 'success',
					isClosable: true,
					position: 'bottom-right',
				});
			},
			onError: (error) => {
				toast({
					title: error.message,
					status: 'error',
					isClosable: true,
					position: 'bottom-right',
				});
			},
		});

	const handleSubmit = async ({
		contentId,
		label,
		noOfTickets,
		maxTicketsOwnable = 0,
	}: {
		contentId: string;
		label: string;
		noOfTickets: number;
		maxTicketsOwnable: number;
	}) => {
		if (!signer) {
			toast({
				title: 'No signer detected!',
				status: 'error',
				isClosable: true,
				position: 'bottom-right',
			});
			return;
		}

		if ((await signer.getAddress()) !== user.address) {
			toast({
				title:
					'Error deploying new contract. Please switch your MetaMask account and chain',
				status: 'error',
				isClosable: true,
				position: 'bottom-right',
			});
			return;
		}

		try {
			const Ticket = new ethers.ContractFactory(abi, bytecode, signer);
			const ticket = await Ticket.deploy(
				contentId,
				noOfTickets,
				maxTicketsOwnable
			);
			createContract({ address: ticket.address, contentId, label });
		} catch {
			toast({
				title: 'Error deploying new contract',
				status: 'error',
				isClosable: true,
				position: 'bottom-right',
			});
		}
	};

	const formik = useFormik({
		initialValues: {
			contentId: '',
			label: '',
			noOfTickets: 0,
			maxTicketsOwnable: 0,
		},
		validationSchema: toFormikValidationSchema(
			z.object({
				contentId: z.string({ required_error: 'CID is required' }),
				label: z.string({ required_error: 'label is required' }),
				noOfTickets: z
					.number({
						required_error: 'Number of tickets is required',
						invalid_type_error: 'Number of tickets must be a number',
					})
					.int('Number of tickets must be an integer')
					.positive('Number of tickets must be positive'),
				maxTicketsOwnable: z
					.number({
						invalid_type_error: 'Max tickets ownable must be a number',
					})
					.int('Max tickets ownable must be an integer')
					.nullish(),
			})
		),
		onSubmit: async (values, actions) => {
			await handleSubmit(values);
			actions.resetForm();
		},
	});

	const [contractToUpdate, setContractToUpdate] = useState('');

	return (
		<>
			<Head>
				<title>Contracts</title>
			</Head>
			<UpdateLabelModal
				isOpen={isOpen}
				onClose={onClose}
				address={contractToUpdate}
			/>
			<DashboardLayout>
				<Stack spacing={10}>
					<form onSubmit={formik.handleSubmit}>
						<Stack spacing={5}>
							<Stack spacing={3}>
								<FormControl
									id="contentId"
									isInvalid={!!formik.errors.contentId}
								>
									<Stack>
										<FormLabel variant="inline">Metadata IPFS CID</FormLabel>
										<InputGroup>
											<InputLeftAddon>ipfs://</InputLeftAddon>
											<Input
												value={formik.values.contentId}
												onChange={formik.handleChange}
												onBlur={formik.handleBlur}
											/>
										</InputGroup>
										{formik.touched.contentId && (
											<FormErrorMessage>
												{formik.errors.contentId}
											</FormErrorMessage>
										)}
									</Stack>
								</FormControl>
								<FormControl id="label" isInvalid={!!formik.errors.label}>
									<Stack>
										<FormLabel variant="inline">Contract Label</FormLabel>
										<Input
											value={formik.values.label}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
										{formik.touched.label && (
											<FormErrorMessage>{formik.errors.label}</FormErrorMessage>
										)}
									</Stack>
								</FormControl>
								<FormControl
									id="noOfTickets"
									isInvalid={!!formik.errors.noOfTickets}
								>
									<Stack>
										<FormLabel variant="inline">Number of Tickets</FormLabel>
										<Input
											type="number"
											value={formik.values.noOfTickets}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
										{formik.touched.noOfTickets && (
											<FormErrorMessage>
												{formik.errors.noOfTickets}
											</FormErrorMessage>
										)}
									</Stack>
								</FormControl>
								<FormControl
									id="maxTicketsOwnable"
									isInvalid={!!formik.errors.maxTicketsOwnable}
								>
									<Stack>
										<FormLabel variant="inline">Max Tickets Ownable</FormLabel>
										<Input
											type="number"
											value={formik.values.maxTicketsOwnable}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
											placeholder="0"
										/>
										{formik.touched.maxTicketsOwnable && (
											<FormErrorMessage>
												{formik.errors.maxTicketsOwnable}
											</FormErrorMessage>
										)}
									</Stack>
									<FormHelperText>
										Put 0 leave blank to disable limit
									</FormHelperText>
								</FormControl>
							</Stack>
							<Button
								type="submit"
								isLoading={createContractIsLoading}
								variant="primary"
							>
								Deploy Smart Contract
							</Button>
						</Stack>
					</form>
					{myContractsIsLoading ? (
						<Spinner />
					) : myContractsIsError ? (
						<Alert>
							<AlertIcon />
							<AlertDescription>Error fetching contracts</AlertDescription>
						</Alert>
					) : (
						myContracts?.length && (
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
												<Text>CID</Text>
											</Th>
											<Th>
												<Text>Created On</Text>
											</Th>
										</Tr>
									</Thead>
									<Tbody>
										{myContracts?.map((item) => (
											<Tr key={item.address}>
												<Td>
													<IconButton
														onClick={() => {
															setContractToUpdate(item.address);
															onOpen();
														}}
														aria-label="update contract"
														icon={<FiEdit />}
														variant="link"
														size="xs"
													/>
												</Td>
												<Td>
													<Text fontSize="xs" color="muted">
														{truncateString(item.address)}
													</Text>
												</Td>
												<Td>
													<Text fontSize="xs" color="muted">
														{item.label}
													</Text>
												</Td>
												<Td>
													<Text fontSize="xs" color="muted">
														{item.event?.name || '-'}
													</Text>
												</Td>
												<Td>
													<Text fontSize="xs" color="muted">
														{truncateString(item.contentId)}
													</Text>
												</Td>
												<Td>
													<Text fontSize="xs" color="muted">
														{item.createdAt.toLocaleDateString()}
													</Text>
												</Td>
											</Tr>
										))}
									</Tbody>
								</Table>
							</TableContainer>
						)
					)}
				</Stack>
			</DashboardLayout>
		</>
	);
};

export default MyContractsPage;
