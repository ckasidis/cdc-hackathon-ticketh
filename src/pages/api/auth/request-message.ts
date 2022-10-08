import Moralis from 'moralis';
import { NextApiRequest, NextApiResponse } from 'next';
import { env } from '../../../env/server.mjs';

const config = {
	domain: env.APP_DOMAIN,
	statement: 'Please sign this message to confirm your identity.',
	uri: env.NEXTAUTH_URL,
	timeout: 60,
};

export default async function handler(
	req: NextApiRequest,
	res: NextApiResponse
) {
	const { address, chain, network } = req.body;

	await Moralis.start({ apiKey: env.MORALIS_API_KEY });

	try {
		const message = await Moralis.Auth.requestMessage({
			address,
			chain,
			network,
			...config,
		});

		res.status(200).json(message);
	} catch (error) {
		res.status(400).json({ error });
		console.error(error);
	}
}
