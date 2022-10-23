# Second Prize Winner of Crypto.com The Next Gen Hackathon 2022!

## How to run this project locally

1. clone the repo and run `yarn install` in the root directory
2. cd into `hardhat` directory and run `npm install`
3. in the `hardhat` directory, run `npx hardhat compile` and `npx hardhat node`
4. run `npx prisma migrate dev`
5. config Environment variables
6. run `yarn dev` and open `localhost:3000`

## Environment Variables
```
# When adding additional env variables, the schema in /env/schema.mjs should be updated accordingly

# Prisma
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Moralis
APP_DOMAIN=
MORALIS_API_KEY=

# Filestack
NEXT_PUBLIC_FILESTACK_API_KEY=
```
