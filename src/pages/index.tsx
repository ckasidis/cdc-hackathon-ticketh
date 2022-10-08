import { Heading } from '@chakra-ui/react';
import { NextPage } from 'next';
import Head from 'next/head';
import BaseLayout from '../components/layouts/BaseLayout';

const HomePage: NextPage = ({}) => {
	return (
		<>
			<Head>
				<title>Home Page</title>
			</Head>
			<BaseLayout>
				<Heading as="h1" size="md" textAlign="center">
					Home Page
				</Heading>
			</BaseLayout>
		</>
	);
};

export default HomePage;
