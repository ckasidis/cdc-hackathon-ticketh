import 'next-auth';

declare module 'next-auth' {
	interface User {
		address: string;
		id: string;
		signature: string;
	}

	interface Session {
		user: User;
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		user: {
			address: string;
			id: string;
			signature: string;
		};
	}
}
