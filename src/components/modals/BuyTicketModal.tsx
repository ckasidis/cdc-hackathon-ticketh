import {
	Alert,
	AlertDescription,
	AlertIcon,
	Button,
	Center,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	SimpleGrid,
	Spinner,
	useToast,
} from '@chakra-ui/react';
import { ethers } from 'ethers';
import { useQuery } from 'react-query';
import { useSigner } from 'wagmi';
import { abi } from '../../../hardhat/artifacts/contracts/Ticket.sol/Ticket.json';

interface BuyTicketModalProps {
	contractAddress: string;
	walletAddress: string;
	isOpen: boolean;
	onClose: () => void;
}

const BuyTicketModal: React.FC<BuyTicketModalProps> = ({
	contractAddress,
	walletAddress,
	isOpen,
	onClose,
}) => {
	const toast = useToast();

	const mintNFT = async (uri: number) => {
		if (!signer) {
			toast({
				title: 'No signer detected! Try refreshing your MetaMask',
				status: 'error',
				isClosable: true,
				position: 'bottom-right',
			});
			return;
		}

		if ((await signer.getAddress()) !== walletAddress) {
			toast({
				title:
					'Error minting a new ticket. Please switch your MetaMask account and chain',
				status: 'error',
				isClosable: true,
				position: 'bottom-right',
			});
			return;
		}

		const ticket = new ethers.Contract(contractAddress, abi, signer);

		try {
			await ticket.safeMint(walletAddress, uri);
		} catch (e: any) {
			toast({
				title: e?.error?.data?.message || 'Error minting a new ticket',
				status: 'error',
				isClosable: true,
				position: 'bottom-right',
			});
		}
	};

	const getUriOwners = async () => {
		if (!signer) {
			throw 'No signer detected!';
		}

		const ticket = new ethers.Contract(contractAddress, abi, signer);

		try {
			return (await ticket.getUriOwners()) as string[];
		} catch (e: any) {
			throw e?.error?.data?.message || 'Error reading contract tickets';
		}
	};

	const {
		data: uriOwners,
		isLoading,
		isError,
	} = useQuery(['read-uri-owners', contractAddress], getUriOwners);

	const { data: signer } = useSigner();

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />
				<ModalHeader>Buy Ticket</ModalHeader>
				<ModalBody>
					{isLoading ? (
						<Center>
							<Spinner />
						</Center>
					) : isError ? (
						<Alert status="error">
							<AlertIcon />
							<AlertDescription>
								Error loading tickets. Try refreshing your MetaMask
							</AlertDescription>
						</Alert>
					) : (
						<SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={2}>
							{uriOwners?.map((owner, i) => (
								<Button
									isDisabled={owner !== ethers.constants.AddressZero}
									key={i}
									onClick={() => mintNFT(i + 1)}
								>
									{owner === ethers.constants.AddressZero
										? `Ticket ${i + 1}`
										: `Sold`}
								</Button>
							))}
						</SimpleGrid>
					)}
				</ModalBody>
				<ModalFooter />
			</ModalContent>
		</Modal>
	);
};

export default BuyTicketModal;
