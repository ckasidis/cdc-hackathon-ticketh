import { As, Button, ButtonProps, HStack, Icon, Text } from '@chakra-ui/react';

interface SidebarButtonProps extends ButtonProps {
	icon: As;
	label: string;
}

const SidebarButton: React.FC<SidebarButtonProps> = ({
	icon,
	label,
	...props
}) => {
	return (
		<Button variant="ghost-on-accent" justifyContent="start" {...props}>
			<HStack spacing="3">
				<Icon as={icon} fontSize="lg" />
				<Text fontSize="sm">{label}</Text>
			</HStack>
		</Button>
	);
};

export default SidebarButton;
