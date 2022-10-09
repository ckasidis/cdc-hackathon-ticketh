import {
	Alert,
	AlertDescription,
	AlertIcon,
	Box,
	Button,
	Center,
	HStack,
	IconButton,
	Image,
	Spinner,
	Stack,
	Text,
	useDisclosure,
	useToast,
} from '@chakra-ui/react';
import * as filestack from 'filestack-js';
import { GetServerSideProps, NextPage } from 'next';
import { User } from 'next-auth';
import { signOut } from 'next-auth/react';
import Head from 'next/head';
import { FiEdit } from 'react-icons/fi';
import { useQueryClient } from 'react-query';
import DashboardLayout from '../../components/layouts/DashboardLayout';
import UpdateUsernameModal from '../../components/modals/UpdateUsernameModal';
import { env } from '../../env/client.mjs';
import { getServerAuthSession } from '../../server/common/get-server-auth-session';
import { trpc } from '../../utils/trpc';

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
	const { isOpen, onOpen, onClose } = useDisclosure();
	const toast = useToast();

	const queryClient = useQueryClient();

	const {
		data: profile,
		isLoading,
		isError,
	} = trpc.useQuery(['users.read-user', { id: user.id }]);

	const { mutate: updateImage } = trpc.useMutation(
		'my-profile.update-profile',
		{
			onSuccess: () => {
				queryClient.invalidateQueries('users.read-user');
				toast({
					title: 'Profile photo updated successfully',
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
		}
	);

	const uploadProfileImage = async () => {
		const client = filestack.init(env.NEXT_PUBLIC_FILESTACK_API_KEY);
		const options: filestack.PickerOptions = {
			accept: 'image/*',
			transformations: {
				crop: {
					aspectRatio: 1 / 1,
				},
			},
			onFileUploadFinished: (res) => {
				updateImage({ image: res.url });
			},
			onFileUploadFailed: () => {
				toast({
					title: 'Error uploading your photo',
					status: 'error',
					isClosable: true,
					position: 'bottom-right',
				});
			},
		};

		client.picker(options).open();
	};

	return (
		<>
			<Head>
				<title>Dashboard Page</title>
			</Head>
			<UpdateUsernameModal id={user.id} isOpen={isOpen} onClose={onClose} />
			<DashboardLayout>
				{isLoading ? (
					<Center>
						<Spinner />
					</Center>
				) : isError ? (
					<Alert status="error">
						<AlertIcon />
						<AlertDescription>Error fetching profile</AlertDescription>
					</Alert>
				) : (
					<Stack spacing="5">
						<Stack alignItems="center" spacing={5} py={5}>
							{profile?.image ? (
								<Image
									src={profile.image}
									alt="profile image"
									w="48"
									borderRadius="full"
								/>
							) : (
								<Image
									src="/default_profile.png"
									alt="profile image"
									w="48"
									borderRadius="full"
								/>
							)}
							<Box>
								<Button onClick={uploadProfileImage} size="xs">
									Edit Profile Photo
								</Button>
							</Box>
						</Stack>
						<Stack>
							<Text as="h3" size="xs">
								Public Address
							</Text>
							<Text
								as="p"
								fontSize={{ base: '10px', sm: 'xs', md: 'sm' }}
								fontWeight="bold"
							>
								{user.address}
							</Text>
						</Stack>
						<Stack>
							<HStack>
								<Text as="h3" size="xs">
									Username
								</Text>
								<IconButton
									onClick={onOpen}
									icon={<FiEdit />}
									aria-label="edit username"
									size="xs"
								/>
							</HStack>
							<Text
								as="p"
								fontSize={{ base: '10px', sm: 'xs', md: 'sm' }}
								fontWeight="bold"
							>
								{profile?.username || '-'}
							</Text>
						</Stack>
						<Button
							onClick={() => signOut({ callbackUrl: '/signin' })}
							variant="primary"
						>
							Sign out
						</Button>
					</Stack>
				)}
			</DashboardLayout>
		</>
	);
};

export default DashboardPage;
