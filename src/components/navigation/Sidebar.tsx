import {
	Flex,
	FlexProps,
	HStack,
	IconButton,
	Stack,
	Text,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { MouseEventHandler } from 'react';
import { IconType } from 'react-icons';
import { FiX, FiUser, FiCalendar, FiFileText } from 'react-icons/fi';
import Logo from '../Logo';
import SideBarButton from './SidebarButton';

interface NavItem {
	label: string;
	icon: IconType;
	path: string;
}

const ManageEvents: NavItem[] = [
	{ label: 'My Events', icon: FiCalendar, path: '/dashboard/events' },
	{
		label: 'My Contracts',
		icon: FiFileText,
		path: '/dashboard/contracts',
	},
];

const MyAccount: NavItem[] = [
	{ label: 'Profile', icon: FiUser, path: '/dashboard' },
];

interface SidebarProps extends FlexProps {
	onClose?: MouseEventHandler<HTMLButtonElement>;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, ...props }) => {
	const router = useRouter();
	return (
		<Flex
			bg="bg-accent"
			w={{ base: 'full', md: 60 }}
			p={{ base: 4, md: 6 }}
			{...props}
		>
			<Stack justify="space-between" spacing="1" width="full">
				<Stack spacing="5" shouldWrapChildren>
					<HStack justifyContent={'space-between'}>
						<Logo />
						{onClose && (
							<IconButton
								onClick={onClose}
								aria-label="close menu"
								variant="ghost-on-accent"
								icon={<FiX />}
							/>
						)}
					</HStack>
					<Stack>
						<Text fontSize="xs" color="on-accent-muted" fontWeight="semibold">
							My Account
						</Text>
						<Stack spacing="1">
							{MyAccount.map((item) => (
								<SideBarButton
									key={item.label}
									onClick={() => router.push(item.path)}
									label={item.label}
									icon={item.icon}
								/>
							))}
						</Stack>
					</Stack>
					<Stack>
						<Text fontSize="xs" color="on-accent-muted" fontWeight="semibold">
							Manage Events
						</Text>
						<Stack spacing="1">
							{ManageEvents.map((item) => (
								<SideBarButton
									key={item.label}
									onClick={() => router.push(item.path)}
									label={item.label}
									icon={item.icon}
								/>
							))}
						</Stack>
					</Stack>
				</Stack>
			</Stack>
		</Flex>
	);
};

export default Sidebar;
