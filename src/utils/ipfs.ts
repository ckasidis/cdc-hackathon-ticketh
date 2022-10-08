export const toGatewayURI = (str: string) => {
	return str.replace('ipfs://', 'https://cloudflare-ipfs.com/ipfs/');
};
