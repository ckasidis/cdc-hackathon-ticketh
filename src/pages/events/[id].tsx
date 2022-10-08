import {
	Alert,
	AlertDescription,
	AlertIcon,
	Button,
	Center,
	Heading,
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

interface EventPageProps {
	user: User;
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
			{contractToBuyTicket && (
				<BuyTicketModal
					contractAddress={contractToBuyTicket}
					walletAddress={user.address}
					isOpen={buyTicket.isOpen}
					onClose={buyTicket.onClose}
				/>
			)}
			{contractToDisplayTickets && (
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
							{event?.description && <Text as="p">{event.description}</Text>}
							<Stack spacing={5}>
								<Heading as="h2" size="sm">
									Event Contracts
								</Heading>
								{event?.contracts.map((contract) => (
									<Stack
										key={contract.address}
										bg="bg-surface"
										p={5}
										rounded="xl"
									>
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
								))}
							</Stack>
						</Stack>
					</>
				)}
			</BaseLayout>
		</>
	);
};

export default EventPage;
