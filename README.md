# How to run this project

1. clone the repo and run `yarn install` in the root directory
2. cd into `hardhat` directory and run `npm install`
3. in the `hardhat` directory, run `npx hardhat compile` and `npx hardhat node`
4. config Environment variables

# When adding additional env variables, the schema in /env/schema.mjs should be updated accordingly

# Prisma
DATABASE_URL=

# NextAuth
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Moralis
APP_DOMAIN=
MORALIS_API_KEY=

#Filestack
NEXT_PUBLIC_FILESTACK_API_KEY=
