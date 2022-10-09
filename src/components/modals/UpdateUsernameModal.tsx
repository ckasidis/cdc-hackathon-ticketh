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

interface UpdateUsernameModalProps {
	id: string;
	isOpen: boolean;
	onClose: () => void;
}

const UpdateUsernameModal: React.FC<UpdateUsernameModalProps> = ({
	id,
	isOpen,
	onClose,
}) => {
	const toast = useToast();

	const queryClient = useQueryClient();

	const {
		data: profile,
		isLoading: profileIsLoading,
		isError: profileIsError,
	} = trpc.useQuery(['users.read-user', { id }]);

	const { mutate: updateUsername, isLoading: updateUsernameIsLoading } =
		trpc.useMutation('my-profile.update-profile', {
			onSuccess: () => {
				queryClient.invalidateQueries('users.read-user');
				toast({
					title: 'Username updated successfully',
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
			username: profile?.username || '',
		},
		enableReinitialize: true,
		validationSchema: toFormikValidationSchema(
			z.object({
				username: z.string().nullish(),
			})
		),
		onSubmit: (values) => {
			updateUsername({
				username: values.username,
			});
		},
	});

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />
				<ModalHeader>Update Username</ModalHeader>
				<form onSubmit={formik.handleSubmit}>
					<ModalBody>
						{profileIsLoading ? (
							<Center>
								<Spinner />
							</Center>
						) : profileIsError ? (
							<Alert status="error">
								<AlertIcon />
								<AlertDescription>Error fetching profile</AlertDescription>
							</Alert>
						) : (
							<Stack spacing={3}>
								<FormControl id="username" isInvalid={!!formik.errors.username}>
									<Stack>
										<FormLabel variant="inline">Username</FormLabel>
										<Input
											value={formik.values.username}
											onChange={formik.handleChange}
											onBlur={formik.handleBlur}
										/>
										{formik.touched.username && (
											<FormErrorMessage>
												{formik.errors.username}
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
								isLoading={updateUsernameIsLoading}
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

export default UpdateUsernameModal;
