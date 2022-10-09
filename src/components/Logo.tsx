import { Button, Image } from '@chakra-ui/react';
import { useRouter } from 'next/router';

const Logo: React.FC = () => {
	const router = useRouter();

	return (
		<Button
			onClick={() => router.push('/')}
			variant="unstyled"
			maxW={{ base: 90, sm: 110 }}
		>
			<Image src="/logo-dark.png" alt="TickETH" />
		</Button>
	);
};

export default Logo;
