import { Button, Stack, Text } from '@chakra-ui/react';
import { GetServerSideProps, NextPage } from 'next';
import { User } from 'next-auth';
import { signOut } from 'next-auth/react';
import Head from 'next/head';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import { getServerAuthSession } from '../../server/common/get-server-auth-session';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
	const session = await getServerAuthSession(ctx);

	// redirect if not authenticated
	if (!session) {
		return {
			redirect: {
				destination: '/signin',
				permanent: false,
			},
		};
	}

	return {
		props: { user: session.user },
	};
};

interface DashboardPageProps {
	user: User;
}

const DashboardPage: NextPage<DashboardPageProps> = ({ user }) => {
	return (
		<>
			<Head>
				<title>Dashboard Page</title>
			</Head>
			<DashboardLayout>
				<Stack spacing="5">
					<Text as="p">Address: {user.address}</Text>
					<Button
						onClick={() => signOut({ callbackUrl: '/signin' })}
						variant="primary"
					>
						Sign out
					</Button>
				</Stack>
			</DashboardLayout>
		</>
	);
};

export default DashboardPage;
