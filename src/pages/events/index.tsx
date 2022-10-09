import {
	AspectRatio,
	Heading,
	Image,
	SimpleGrid,
	Skeleton,
	Stack,
	Text,
} from '@chakra-ui/react';
import { GetServerSideProps, NextPage } from 'next';
import { User } from 'next-auth';
import Head from 'next/head';
import Link from 'next/link';
import BaseLayout from '../../components/layouts/BaseLayout';
import { getServerAuthSession } from '../../server/common/get-server-auth-session';
import { trpc } from '../../utils/trpc';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const session = await getServerAuthSession(ctx);

	return {
		props: {
			user: session?.user || null,
		},
	};
};

interface EventsPageProps {
	user: User | null;
}

const EventsPage: NextPage<EventsPageProps> = ({ user }) => {
	const { data: events } = trpc.useQuery(['events.read-events']);
	return (
		<>
			<Head>
				<title>Join Events</title>
			</Head>
			<BaseLayout>
				<Stack spacing={10}>
					<Heading as="h1" size="md" textAlign="center">
						Join Events
					</Heading>
					<SimpleGrid columns={{ base: 1, sm: 2 }} spacing={10}>
						{events?.map((event) => (
							<Link key={event.id} href={`/events/${event.id}`} passHref>
								<Stack cursor="pointer">
									<AspectRatio ratio={16 / 9}>
										<Image
											src={event.image || 'default_banner.jpg'}
											alt={event.name}
											draggable="false"
										/>
									</AspectRatio>
									<Heading as="h2" size="xs">
										{event.name}
									</Heading>
								</Stack>
							</Link>
						))}
					</SimpleGrid>
				</Stack>
			</BaseLayout>
		</>
	);
};

export default EventsPage;
