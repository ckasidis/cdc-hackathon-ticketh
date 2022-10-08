import { ethers } from 'hardhat';
import { expect } from 'chai';

const exampleCid = 'QmcS1xMbDL9dWADoeVnfZ3xeig9bdrhFuwb272ai98mbvf';

describe('Deploy contract', function () {
	it('Deployment should assign the total supply of tokens to the owner', async function () {
		const [owner] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(exampleCid, 10, 1);

		expect(await event.owner()).to.equal(owner.address);

		const ownerBalance = await event.balanceOf(owner.address);
		expect(await event.totalSupply()).to.equal(ownerBalance);
	});
});

describe('Safe Mint', function () {
	it('Owner should be able to mint a new Token', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(exampleCid, 10, 1);

		await event.safeMint(owner.address, 1);
		expect(await event.totalSupply()).to.equal(1);
		expect(await event.ownerOf(0)).to.equal(owner.address);
		expect(await event.balanceOf(owner.address)).to.equal(1);
		expect(await event.tokenURI(0)).to.equal(`ipfs://${exampleCid}/1.json`);

		await event.safeMint(account1.address, 10);
		expect(await event.totalSupply()).to.equal(2);
		expect(await event.ownerOf(1)).to.equal(account1.address);
		expect(await event.tokenURI(1)).to.equal(`ipfs://${exampleCid}/10.json`);
	});

	it('Non-owner should be able to mint a new Token', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(exampleCid, 10, 2);

		await event.connect(account1).safeMint(account1.address, 1);
		expect(await event.totalSupply()).to.equal(1);
		expect(await event.ownerOf(0)).to.equal(account1.address);
		expect(await event.tokenURI(0)).to.equal(`ipfs://${exampleCid}/1.json`);

		await event.connect(account1).safeMint(owner.address, 10);
		expect(await event.totalSupply()).to.equal(2);
		expect(await event.ownerOf(1)).to.equal(owner.address);
		expect(await event.tokenURI(1)).to.equal(`ipfs://${exampleCid}/10.json`);
	});
});

describe('Duplicate Token URI', function () {
	it('Should not be able to mint sold Token URIs', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(exampleCid, 10, 1);

		await event.safeMint(owner.address, 1);
		expect(await event.totalSupply()).to.equal(1);
		expect(await event.ownerOf(0)).to.equal(owner.address);
		expect(await event.tokenURI(0)).to.equal(`ipfs://${exampleCid}/1.json`);

		await expect(event.safeMint(account1.address, 1)).to.be.revertedWith(
			'This ticket has already been sold'
		);
	});
});

describe('Invalid Token URI', function () {
	it('URI cannot be greater than noOfTokens', async function () {
		const [owner] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(exampleCid, 10, 1);

		await expect(event.safeMint(owner.address, 11)).to.be.revertedWith(
			'Invalid token uri'
		);
	});

	it('URI cannot be less than 1', async function () {
		const [owner] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(exampleCid, 10, 1);

		await expect(event.safeMint(owner.address, 0)).to.be.revertedWith(
			'Invalid token uri'
		);
	});
});

describe('Mint Exceed Ticket Ownable Limit', function () {
	it('Max Ownable Limit = 1, mint', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(exampleCid, 10, 1);

		await event.connect(account1).safeMint(account1.address, 1);
		await expect(
			event.connect(account1).safeMint(account1.address, 2)
		).to.be.revertedWith('This address owned maximum number of tickets');
	});

	it('Max Ownable Limit = 2, mint', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(exampleCid, 10, 2);

		await event.connect(account1).safeMint(account1.address, 1);
		await event.connect(account1).safeMint(account1.address, 2);
		expect(await event.connect(account1).balanceOf(account1.address)).to.equal(
			2
		);
		await expect(
			event.connect(account1).safeMint(account1.address, 3)
		).to.be.revertedWith('This address owned maximum number of tickets');
	});
});
