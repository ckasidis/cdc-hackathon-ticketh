import {
	Alert,
	AlertDescription,
	AlertIcon,
	Center,
	Image,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	SimpleGrid,
	Spinner,
	Stack,
} from '@chakra-ui/react';
import axios from 'axios';
import { ethers } from 'ethers';
import { useQuery } from 'react-query';
import { useSigner } from 'wagmi';
import { abi } from '../../../hardhat/artifacts/contracts/Ticket.sol/Ticket.json';
import { toGatewayURI } from '../../utils/ipfs';

interface DisplayTicketsModalProps {
	contractAddress: string;
	walletAddress: string;
	isOpen: boolean;
	onClose: () => void;
}

const DisplayTicketsModal: React.FC<DisplayTicketsModalProps> = ({
	contractAddress,
	walletAddress,
	isOpen,
	onClose,
}) => {
	const getTokensMetaData = async () => {
		if (!signer) {
			throw 'No signer detected, please refresh your MetaMask';
		}

		const ticket = new ethers.Contract(contractAddress, abi, signer);

		try {
			const tokenIdPromises = [];
			const noOfTokens = await ticket.balanceOf(walletAddress);
			for (let i = 0; i < noOfTokens; i++) {
				tokenIdPromises.push(ticket.tokenOfOwnerByIndex(walletAddress, i));
			}

			const tokenUriPromises = [];
			for await (const tokenId of tokenIdPromises) {
				tokenUriPromises.push(ticket.tokenURI(tokenId));
			}

			const tokenMetaPromises = [];
			for await (const tokenUri of tokenUriPromises) {
				tokenMetaPromises.push(axios.get(toGatewayURI(tokenUri)));
			}

			const tokensMetaData: any[] = [];
			for await (const tokenMeta of tokenMetaPromises) {
				tokensMetaData.push(tokenMeta.data);
			}

			return tokensMetaData;
		} catch (e: any) {
			throw e?.error?.data?.message || 'Error reading tickets from MetaMask';
		}
	};

	const { data: signer } = useSigner();
	const {
		data: tokens,
		isLoading,
		isError,
	} = useQuery(['read-tokens-metadata', contractAddress], getTokensMetaData);

	return (
		<Modal isOpen={isOpen} onClose={onClose}>
			<ModalOverlay />
			<ModalContent>
				<ModalCloseButton />
				<ModalHeader>My Tickets</ModalHeader>
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
					) : tokens?.length ? (
						<SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={2}>
							{tokens.map((token, i) => (
								<Stack key={i}>
									<Image src={toGatewayURI(token.image)} alt={token.image} />
								</Stack>
							))}
						</SimpleGrid>
					) : (
						<Alert status="info">
							<AlertIcon />
							<AlertDescription>
								You have no tickets for this event!
							</AlertDescription>
						</Alert>
					)}
				</ModalBody>
				<ModalFooter />
			</ModalContent>
		</Modal>
	);
};

export default DisplayTicketsModal;
