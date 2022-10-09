import { ethers } from 'hardhat';
import 'dotenv/config';

async function main() {
    const Ticket = await ethers.getContractFactory('Ticket');
    const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 1, 0, 0);
    await event.deployed();

    console.log("Event deployed to:", event.address);
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
})