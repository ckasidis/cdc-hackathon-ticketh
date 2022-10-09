import {
	Alert,
	AlertDescription,
	AlertIcon,
	Box,
	Button,
	Center,
	Checkbox,
	CheckboxGroup,
	FormControl,
	FormErrorMessage,
	FormHelperText,
	FormLabel,
	HStack,
	Image,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Select,
	Spinner,
	Stack,
	Textarea,
	useToast,
} from '@chakra-ui/react';
import * as filestack from 'filestack-js';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useQueryClient } from 'react-query';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { env } from '../../env/client.mjs';
import { trpc } from '../../utils/trpc';
import { truncateString } from '../../utils/truncate';

interface UpdateEventModalProps {
	id: string;
	isOpen: boolean;
	onClose: () => void;
}

const UpdateEventModal: React.FC<UpdateEventModalProps> = ({
	id,
	isOpen,
	onClose,
}) => {
	const toast = useToast();

	const queryClient = useQueryClient();

	const {
		data: myContracts,
		isLoading: myContractsIsLoading,
		isError: myContractsIsError,
	} = trpc.useQuery(['my-contracts.read-contracts']);

	const {
		data: event,
		isLoading: eventIsLoading,
		isError: eventIsError,
	} = trpc.useQuery([
		'my-events.read-event',
		{
			id,
		},
	]);

	const { mutate: updateEvent, isLoading: updateEventIsLoading } =
		trpc.useMutation('my-events.update-event', {
			onSuccess: () => {
				queryClient.invalidateQueries('my-events.read-events');
				queryClient.invalidateQueries('my-events.read-event');
				queryClient.invalidateQueries('my-contracts.read-contracts');
				queryClient.invalidateQueries('my-contracts.read-contract');
				toast({
					title: 'Event updated successfully',
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
			onSettled: onClose,
		});

	const uploadBannerImage = async () => {
		const client = filestack.init(env.NEXT_PUBLIC_FILESTACK_API_KEY);
		const options: filestack.PickerOptions = {
			accept: 'image/*',
			transformations: {
				crop: {
					aspectRatio: 16 / 9,
				},
			},
			onFileUploadFinished: (res) => {
				setImageUrl(res.url);
			},
			onFileUploadFailed: () => {
				toast({
					title: 'Error uploading your photo',
					status: 'error',
					isClosable: true,
					position: 'bottom-right',
				});
			},
		};

		client.picker(options).open();
	};

	const formik = useFormik({
		initialValues: {
			name: event?.name || '',
			contracts: event?.contracts,
			description: event?.description || '',
			status: event?.status || ('DRAFT' as 'DRAFT' | 'PUBLISHED'),
		},
		enableReinitialize: true,
		validationSchema: toFormikValidationSchema(
			z.object({
				name: z.string({ required_error: 'name is required' }),
				description: z.string().nullish(),
				status: z.enum(['DRAFT', 'PUBLISHED']),
			})
		),
		onSubmit: (values) => {
			updateEvent({
				id,
				image: imageUrl,
				...values,
			});
		},
	});

	const [imageUrl, setImageUrl] = useState(event?.image || '');

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />
				<ModalHeader>Update Event</ModalHeader>
				<form onSubmit={formik.handleSubmit}>
					<ModalBody>
						{eventIsLoading ? (
							<Center>
								<Spinner />
							</Center>
						) : eventIsError ? (
							<Alert status="error">
								<AlertIcon />
								<AlertDescription>Error fetching event</AlertDescription>
							</Alert>
						) : (
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
								<FormControl id="banner-image" isInvalid={!!formik.errors.name}>
									<FormLabel>Banner Image</FormLabel>
									<HStack>
										<Image
											src={imageUrl || '/default_banner.jpg'}
											alt="banner image"
											w={20}
											borderRadius="lg"
										/>
										<Button onClick={uploadBannerImage} size="sm">
											Upload Banner Image
										</Button>
									</HStack>
								</FormControl>
								<FormControl
									id="description"
									isInvalid={!!formik.errors.description}
								>
									<Stack>
										<Box>
											<FormLabel variant="inline">Event Description</FormLabel>
											<FormHelperText mt="0" color="muted">
												Write a short introduction about your event
											</FormHelperText>
										</Box>
										<Textarea
											value={formik.values.description}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
										{formik.touched.description && (
											<FormErrorMessage>
												{formik.errors.description}
											</FormErrorMessage>
										)}
									</Stack>
								</FormControl>
								<FormControl id="contracts">
									<Stack>
										<FormLabel variant="inline">Link Contracts</FormLabel>
										{myContractsIsLoading ? (
											<Center>
												<Spinner />
											</Center>
										) : myContractsIsError ? (
											<Alert status="error">
												<AlertIcon />
												<AlertDescription>
													Error fetching contracts
												</AlertDescription>
											</Alert>
										) : !myContracts?.filter(
												(item) => item.eventId == event?.id || !item.eventId
										  ).length ? (
											<Alert status="warning">
												<AlertIcon />
												<AlertDescription>
													You don&lsquo;t have any available contracts to link.
													Please create new contracts or unlink contracts from
													other events.
												</AlertDescription>
											</Alert>
										) : (
											<CheckboxGroup
												value={formik.values.contracts?.map(
													(item) => item.address
												)}
												onChange={(value) => {
													formik.setFieldValue(
														'contracts',
														value.map((item) => ({ address: item.toString() }))
													);
												}}
											>
												<Stack maxH={20} overflowY="scroll">
													{myContracts
														.filter(
															(item) =>
																item.eventId == event?.id || !item.eventId
														)
														.map((item) => (
															<Checkbox key={item.address} value={item.address}>
																{truncateString(item.address)} ({item.label})
															</Checkbox>
														))}
												</Stack>
											</CheckboxGroup>
										)}
									</Stack>
								</FormControl>
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
							</Stack>
						)}
					</ModalBody>
					<ModalFooter>
						<HStack>
							<Button
								type="submit"
								isLoading={updateEventIsLoading}
								variant="primary"
							>
								Update
							</Button>
						</HStack>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
};

export default UpdateEventModal;
