import {
	Box,
	Button,
	FormControl,
	FormErrorMessage,
	FormHelperText,
	FormLabel,
	Input,
	InputGroup,
	InputLeftAddon,
	ListItem,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Stack,
	UnorderedList,
	useToast,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useFormik } from 'formik';
import { useQueryClient } from 'react-query';
import { useSigner } from 'wagmi';
import { z } from 'zod';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import { trpc } from '../../utils/trpc';
import {
	abi,
	bytecode,
} from '../../../hardhat/artifacts/contracts/Ticket.sol/Ticket.json';

interface DeployContractModalProps {
	walletAddress: string;
	isOpen: boolean;
	onClose: () => void;
}

const DeployContractModal: React.FC<DeployContractModalProps> = ({
	walletAddress,
	isOpen,
	onClose,
}) => {
	const toast = useToast();

	const queryClient = useQueryClient();
	const { data: signer } = useSigner();

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
			onSettled: onClose,
		});

	const handleSubmit = async ({
		contentId,
		label,
		noOfTickets,
		ticketPrice,
		maxTicketsOwnable = 0,
		maxResellPrice = 0,
		royaltyPercent = 0,
	}: {
		contentId: string;
		label: string;
		noOfTickets: number;
		ticketPrice: number;
		maxTicketsOwnable: number;
		maxResellPrice: number;
		royaltyPercent: number;
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

		if ((await signer.getAddress()) !== walletAddress) {
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
				//eth to wei
				BigInt(ticketPrice) * BigInt(1e18),
				maxTicketsOwnable,
				maxResellPrice,
				royaltyPercent * 100
			);
			createContract({ address: ticket.address, label });
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
			ticketPrice: 0,
			maxTicketsOwnable: 0,
			maxResellPrice: 0,
			royaltyPercent: 0,
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
				ticketPrice: z
					.number({
						invalid_type_error: 'Ticket price must be a number',
					})
					.positive('Ticket price must be positive'),
				maxTicketsOwnable: z
					.number({
						invalid_type_error: 'Max tickets ownable must be a number',
					})
					.int('Max tickets ownable must be an integer')
					.nonnegative('Max tickets must be non negative')
					.nullish(),
				maxResellPrice: z
					.number({
						invalid_type_error: 'Max resell price must be a number',
					})
					.int('Max resell price must be an integer')
					.nonnegative('Max resell price must be non negative')
					.nullish(),
				royaltyPercent: z
					.number({
						invalid_type_error: 'Royalty percentage must be a number',
					})
					.int('Royalty percentage must be an integer')
					.nonnegative('Royalty percentage must not be negative')
					.max(99, 'Royalty percentage must be less than 100')
					.nullish(),
			})
		),
		onSubmit: async (values, actions) => {
			await handleSubmit(values);
			actions.resetForm();
		},
	});

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />
				<ModalHeader>Deploy Smart Contract</ModalHeader>
				<form onSubmit={formik.handleSubmit}>
					<ModalBody>
						<Stack spacing={3}>
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
							<FormControl id="contentId" isInvalid={!!formik.errors.contentId}>
								<Stack>
									<Box>
										<FormLabel variant="inline">Metadata IPFS CID</FormLabel>
										<FormHelperText mt={0} color="muted" fontSize="xs">
											<UnorderedList>
												<ListItem>
													Please upload an IPFS folder containing 1.json -
													n.json NFT metadata files (n is the total number of
													tickets)
												</ListItem>
												<ListItem>
													json metadata files must have &ldquo;name&rdquo; and
													&ldquo;image&rdquo; keys
												</ListItem>
											</UnorderedList>
										</FormHelperText>
									</Box>
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
								id="ticketPrice"
								isInvalid={!!formik.errors.ticketPrice}
							>
								<Stack>
									<FormLabel variant="inline">Ticket Price (Ether)</FormLabel>
									<Input
										type="number"
										value={formik.values.ticketPrice}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.ticketPrice && (
										<FormErrorMessage>
											{formik.errors.ticketPrice}
										</FormErrorMessage>
									)}
								</Stack>
							</FormControl>
							<FormControl
								id="maxTicketsOwnable"
								isInvalid={!!formik.errors.maxTicketsOwnable}
							>
								<Stack>
									<Box>
										<FormLabel variant="inline">Max Tickets Ownable</FormLabel>
										<FormHelperText mt={0} color="muted">
											Put 0 leave blank to disable limit
										</FormHelperText>
									</Box>
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
							</FormControl>
							<FormControl
								id="maxResellPrice"
								isInvalid={!!formik.errors.maxResellPrice}
							>
								<Stack>
									<Box>
										<FormLabel variant="inline">Max Resell Price</FormLabel>
										<FormHelperText mt={0} color="muted">
											Put 0 leave blank to disable limit
										</FormHelperText>
									</Box>
									<Input
										type="number"
										value={formik.values.maxResellPrice}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.maxResellPrice && (
										<FormErrorMessage>
											{formik.errors.maxResellPrice}
										</FormErrorMessage>
									)}
								</Stack>
							</FormControl>
							<FormControl
								id="royaltyPercent"
								isInvalid={!!formik.errors.royaltyPercent}
							>
								<Stack>
									<Box>
										<FormLabel variant="inline">Royalty Percentage</FormLabel>
										<FormHelperText mt={0} color="muted">
											Put 0 leave blank to disable
										</FormHelperText>
									</Box>
									<Input
										type="number"
										value={formik.values.royaltyPercent}
										onChange={formik.handleChange}
										onBlur={formik.handleBlur}
									/>
									{formik.touched.royaltyPercent && (
										<FormErrorMessage>
											{formik.errors.royaltyPercent}
										</FormErrorMessage>
									)}
								</Stack>
							</FormControl>
						</Stack>
					</ModalBody>
					<ModalFooter>
						<Button
							type="submit"
							isLoading={createContractIsLoading}
							variant="primary"
						>
							Deploy
						</Button>
					</ModalFooter>
				</form>
			</ModalContent>
		</Modal>
	);
};

export default DeployContractModal;
