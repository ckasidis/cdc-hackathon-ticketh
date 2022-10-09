import {
	Alert,
	AlertDescription,
	AlertIcon,
	AspectRatio,
	Avatar,
	Heading,
	HStack,
	Image,
	SimpleGrid,
	Stack,
	Text,
} from '@chakra-ui/react';
import { NextPage } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import BaseLayout from '../../components/layouts/BaseLayout';
import { trpc } from '../../utils/trpc';

const EventsPage: NextPage = () => {
	const { data: events } = trpc.useQuery(['events.read-events']);
	return (
		<>
			<Head>
				<title>Search Events</title>
			</Head>
			<BaseLayout>
				<Stack spacing={5}>
					<Heading as="h1" size="sm" textAlign="center">
						Search Events
					</Heading>
					{events?.length ? (
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
										<HStack spacing={3}>
											<Avatar
												size="sm"
												src={event.user.image || '/default_profile.png'}
											/>
											<Text>{event.user.username || 'anonymous'}</Text>
										</HStack>
									</Stack>
								</Link>
							))}
						</SimpleGrid>
					) : (
						<Alert status="info">
							<AlertIcon />
							<AlertDescription>
								There is no published event at this time
							</AlertDescription>
						</Alert>
					)}{' '}
				</Stack>
			</BaseLayout>
		</>
	);
};

export default EventsPage;
