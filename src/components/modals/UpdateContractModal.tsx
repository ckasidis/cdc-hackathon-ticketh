import {
	Alert,
	AlertDescription,
	AlertIcon,
	Button,
	Center,
	FormControl,
	FormErrorMessage,
	FormLabel,
	HStack,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Spinner,
	Stack,
	useToast,
} from '@chakra-ui/react';
import { useFormik } from 'formik';
import { useQueryClient } from 'react-query';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { trpc } from '../../utils/trpc';

interface UpdateContractModalProps {
	address: string;
	isOpen: boolean;
	onClose: () => void;
}

const UpdateContractModal: React.FC<UpdateContractModalProps> = ({
	address,
	isOpen,
	onClose,
}) => {
	const toast = useToast();

	const queryClient = useQueryClient();

	const {
		data: contract,
		isLoading: contractIsLoading,
		isError: contractIsError,
	} = trpc.useQuery([
		'my-contracts.read-contract',
		{
			address,
		},
	]);

	const { mutate: updateContract, isLoading: updateContractIsLoading } =
		trpc.useMutation('my-contracts.update-contract', {
			onSuccess: () => {
				queryClient.invalidateQueries('my-contracts.read-contracts');
				toast({
					title: 'Contract updated successfully',
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
	const formik = useFormik({
		initialValues: {
			label: contract?.label || '',
		},
		enableReinitialize: true,
		validationSchema: toFormikValidationSchema(
			z.object({
				label: z.string({ required_error: 'label is required' }),
			})
		),
		onSubmit: (values) => {
			updateContract({
				address,
				...values,
			});
		},
	});

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />
				<ModalHeader>Update Contract</ModalHeader>
				<form onSubmit={formik.handleSubmit}>
					<ModalBody>
						{contractIsLoading ? (
							<Center>
								<Spinner />
							</Center>
						) : contractIsError ? (
							<Alert status="error">
								<AlertIcon />
								<AlertDescription>Error fetching contract</AlertDescription>
							</Alert>
						) : (
							<Stack spacing={3}>
								<FormControl id="address">
									<Stack>
										<FormLabel variant="inline">Address</FormLabel>
										<Input value={contract?.address} disabled />
									</Stack>
								</FormControl>
								<FormControl id="contentId">
									<Stack>
										<FormLabel variant="inline">CID</FormLabel>
										<Input value={contract?.contentId} disabled />
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
							</Stack>
						)}
					</ModalBody>
					<ModalFooter>
						<HStack>
							<Button
								type="submit"
								isLoading={updateContractIsLoading}
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

export default UpdateContractModal;
