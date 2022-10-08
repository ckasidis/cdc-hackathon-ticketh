import {
	Alert,
	AlertDescription,
	AlertIcon,
	Badge,
	Box,
	Button,
	FormControl,
	FormErrorMessage,
	FormHelperText,
	FormLabel,
	IconButton,
	Input,
	List,
	ListItem,
	Select,
	Spinner,
	Stack,
	Table,
	TableContainer,
	Tbody,
	Td,
	Text,
	Textarea,
	Th,
	Thead,
	Tr,
	useDisclosure,
	useToast,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import { GetServerSideProps, NextPage } from 'next';
import { User } from 'next-auth';
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { FiEdit, FiExternalLink } from 'react-icons/fi';
import { useQueryClient } from 'react-query';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import UpdateEventModal from '../../components/modals/UpdateEventModal';
import { getServerAuthSession } from '../../server/common/get-server-auth-session';
import { trpc } from '../../utils/trpc';
import { truncateString } from '../../utils/truncate';

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

interface MyEventsPageProps {
	user: User;
}

const MyEventsPage: NextPage<MyEventsPageProps> = () => {
	const toast = useToast();
	const { isOpen, onOpen, onClose } = useDisclosure();

	const queryClient = useQueryClient();
	const {
		data: myEvents,
		isLoading: myEventsIsLoading,
		error: myEventsIsError,
	} = trpc.useQuery(['my-events.read-events']);

	const { mutate: createEvent, isLoading: createEventIsLoading } =
		trpc.useMutation('my-events.create-event', {
			onSuccess: () => {
				queryClient.invalidateQueries('my-events.read-events');
				toast({
					title: 'Created new event successfully',
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

	const formik = useFormik({
		initialValues: {
			name: '',
			description: '',
			status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
		},
		validationSchema: toFormikValidationSchema(
			z.object({
				name: z.string({ required_error: 'name is required' }),
				description: z.string().nullish(),
				status: z.enum(['DRAFT', 'PUBLISHED']),
			})
		),
		onSubmit: (values, actions) => {
			createEvent(values);
			actions.resetForm();
		},
	});

	const [eventToUpdate, setEventToUpdate] = useState('');

	return (
		<>
			<Head>
				<title>My Events</title>
			</Head>
			<UpdateEventModal id={eventToUpdate} isOpen={isOpen} onClose={onClose} />
			<DashboardLayout>
				<Stack spacing={10}>
					<form onSubmit={formik.handleSubmit}>
						<Stack spacing={5}>
							<Stack spacing={3}>
								<FormControl id="name" isInvalid={!!formik.errors.name}>
									<Stack>
										<FormLabel variant="inline">Event Name</FormLabel>
										<Input
											value={formik.values.name}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
										{formik.touched.name && (
											<FormErrorMessage>{formik.errors.name}</FormErrorMessage>
										)}
									</Stack>
								</FormControl>
								<FormControl
									id="description"
									isInvalid={!!formik.errors.description}
								>
									<Stack>
										<Box>
											<FormLabel variant="inline">Event Description</FormLabel>
											<FormHelperText mt={0} color="muted">
												Write a short introduction about your event
											</FormHelperText>
										</Box>
										<Textarea
											value={formik.values.description}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
										<FormControl id="status" isInvalid={!!formik.errors.status}>
											<Stack>
												<FormLabel variant="inline">Status</FormLabel>
												<Select
													value={formik.values.status}
													onChange={formik.handleChange}
													onBlur={formik.handleBlur}
													variant="filled"
												>
													<option value="DRAFT">draft</option>
													<option value="PUBLISHED">published</option>
												</Select>
												{formik.touched.status && (
													<FormErrorMessage>
														{formik.errors.status}
													</FormErrorMessage>
												)}
											</Stack>
										</FormControl>
										{formik.touched.description && (
											<FormErrorMessage>
												{formik.errors.description}
											</FormErrorMessage>
										)}
									</Stack>
								</FormControl>
							</Stack>
							<Button
								type="submit"
								isLoading={createEventIsLoading}
								variant="primary"
							>
								Create Event
							</Button>
						</Stack>
					</form>
					{myEventsIsLoading ? (
						<Spinner />
					) : myEventsIsError ? (
						<Alert status="error">
							<AlertIcon />
							<AlertDescription>Error fetching events</AlertDescription>
						</Alert>
					) : (
						myEvents?.length && (
							<TableContainer>
								<Table size="sm">
									<Thead>
										<Tr>
											<Th></Th>
											<Th>
												<Text>Name</Text>
											</Th>
											<Th>
												<Text>Status</Text>
											</Th>
											<Th>
												<Text>Description</Text>
											</Th>
											<Th>
												<Text>Contracts</Text>
											</Th>
											<Th>
												<Text>Created On</Text>
											</Th>
										</Tr>
									</Thead>
									<Tbody>
										{myEvents?.map((event) => (
											<Tr key={event.id}>
												<Td>
													<IconButton
														onClick={() => {
															setEventToUpdate(event.id);
															onOpen();
														}}
														aria-label="update event"
														icon={<FiEdit />}
														variant="link"
														size="xs"
													/>
													<Link href={`/events/${event.id}`}>
														<a target="_blank" rel="noopener noreferrer">
															<IconButton
																aria-label="open event in new tab"
																icon={<FiExternalLink />}
																variant="link"
																size="xs"
															/>
														</a>
													</Link>
												</Td>
												<Td>
													<Text fontSize="xs" color="muted">
														{event.name}
													</Text>
												</Td>
												<Td>
													<Badge
														size="sm"
														colorScheme={
															event.status === 'DRAFT' ? 'yellow' : 'green'
														}
													>
														<Text fontSize="xs">{event.status}</Text>
													</Badge>
												</Td>
												<Td>
													<Text fontSize="xs" color="muted">
														{event.description
															? truncateString(event.description, 10)
															: '-'}
													</Text>
												</Td>
												<Td>
													{event.contracts.length ? (
														<List spacing={1}>
															{event.contracts.map((contract) => (
																<ListItem key={contract.address}>
																	<Text fontSize="xs" color="muted">
																		{truncateString(contract.address)}
																	</Text>
																</ListItem>
															))}
														</List>
													) : (
														<Text fontSize="xs" color="muted">
															-
														</Text>
													)}
												</Td>
												<Td>
													<Text fontSize="xs" color="muted">
														{event.createdAt.toLocaleDateString()}
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

export default MyEventsPage;
