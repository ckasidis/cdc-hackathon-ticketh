import { HStack, IconButton } from '@chakra-ui/react';
import { MouseEventHandler } from 'react';
import { FiMenu } from 'react-icons/fi';
import Logo from '../Logo';

interface MobileHeaderProps {
	onOpen?: MouseEventHandler<HTMLButtonElement>;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onOpen }) => {
	return (
		<HStack justifyContent="space-between" bg="bg-accent" p="4">
			<Logo />
			<IconButton
				onClick={onOpen}
				aria-label="menu"
				variant="ghost-on-accent"
				icon={<FiMenu />}
			/>
		</HStack>
	);
};

export default MobileHeader;
