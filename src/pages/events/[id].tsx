import {
	Alert,
	AlertDescription,
	AlertIcon,
	Avatar,
	Button,
	Center,
	Heading,
	HStack,
	Image,
	SimpleGrid,
	Spinner,
	Stack,
	Text,
	useDisclosure,
} from '@chakra-ui/react';
import { GetServerSideProps, NextPage } from 'next';
import Error from 'next/error';
import Head from 'next/head';
import { useRouter } from 'next/router';
import BaseLayout from '../../components/layouts/BaseLayout';
import { getServerAuthSession } from '../../server/common/get-server-auth-session';
import { trpc } from '../../utils/trpc';
import { User } from 'next-auth';
import BuyTicketModal from '../../components/modals/BuyTicketModal';
import { useState } from 'react';
import DisplayTicketsModal from '../../components/modals/DisplayTicketsModal';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const session = await getServerAuthSession(ctx);

	return {
		props: {
			user: session?.user || null,
		},
	};
};

interface EventPageProps {
	user?: User | null;
}

const EventPage: NextPage<EventPageProps> = ({ user }) => {
	const buyTicket = useDisclosure();
	const displayTickets = useDisclosure();

	const router = useRouter();
	const id = router.query.id as string;

	const {
		data: event,
		isSuccess,
		isLoading,
		isError,
	} = trpc.useQuery(['events.read-event', { id }]);

	const [contractToBuyTicket, setContractToBuyTicket] = useState<string | null>(
		null
	);
	const [contractToDisplayTickets, setContractToDisplayTickets] = useState<
		string | null
	>(null);

	if (isSuccess && !event) {
		return <Error statusCode={404} />;
	}

	return (
		<>
			<Head>
				<title>Event Page</title>
			</Head>
			{user && contractToBuyTicket && (
				<BuyTicketModal
					contractAddress={contractToBuyTicket}
					walletAddress={user.address}
					isOpen={buyTicket.isOpen}
					onClose={buyTicket.onClose}
				/>
			)}
			{user && contractToDisplayTickets && (
				<DisplayTicketsModal
					contractAddress={contractToDisplayTickets}
					walletAddress={user.address}
					isOpen={displayTickets.isOpen}
					onClose={displayTickets.onClose}
				/>
			)}
			<BaseLayout>
				{isLoading ? (
					<Center>
						<Spinner />
					</Center>
				) : isError ? (
					<Alert status="error">
						<AlertIcon />
						<AlertDescription>Error fetching event</AlertDescription>
					</Alert>
				) : (
					<>
						<Stack spacing={10}>
							<Heading as="h1" size="md">
								{event?.name}
							</Heading>
							<Image
								src={event?.image || '/default_banner.jpg'}
								alt="banner image"
								w="full"
							/>
							<HStack spacing={3}>
								<Avatar
									size="sm"
									src={event?.user.image || '/default_profile.png'}
								/>
								<Text>{event?.user.username || 'anonymous'}</Text>
							</HStack>
							{event?.description && <Text as="p">{event.description}</Text>}
							{user ? (
								<Stack spacing={5}>
									<Heading as="h2" size="sm">
										Event Contracts
									</Heading>
									{event?.contracts.length ? (
										event?.contracts.map((contract) => (
											<Stack
												key={contract.address}
												spacing={3}
												bg="bg-surface"
												p={5}
												rounded="xl"
											>
												<Heading as="h3" size="xs">
													{contract.label}
												</Heading>
												<Text>{contract.address}</Text>
												<SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
													<Button
														onClick={() => {
															setContractToBuyTicket(contract.address);
															buyTicket.onOpen();
														}}
														variant="primary"
													>
														Buy a Ticket
													</Button>
													<Button
														onClick={() => {
															setContractToDisplayTickets(contract.address);
															displayTickets.onOpen();
														}}
														variant="secondary"
													>
														My Tickets
													</Button>
												</SimpleGrid>
											</Stack>
										))
									) : (
										<Alert status="warning">
											<AlertIcon />
											<AlertDescription>
												This event does not have any contracts
											</AlertDescription>
										</Alert>
									)}
								</Stack>
							) : (
								<Alert status="info">
									<AlertIcon />
									<AlertDescription>
										Login with MetaMask to buy tickets
									</AlertDescription>
								</Alert>
							)}
						</Stack>
					</>
				)}
			</BaseLayout>
		</>
	);
};

export default EventPage;
