import { Button, Text } from '@chakra-ui/react';
import { useRouter } from 'next/router';

const Logo: React.FC = () => {
	const router = useRouter();

	return (
		<Button onClick={() => router.push('/')} variant="unstyled">
			<Text fontSize="xl" color="on-accent" fontWeight="bold">
				App Logo
			</Text>
		</Button>
	);
};

export default Logo;
