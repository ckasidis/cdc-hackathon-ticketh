import { ethers } from 'hardhat';
import { expect } from 'chai';
import 'dotenv/config';

describe('Deploy contract', function () {
	it('Deployment should assign the total supply of tokens to the owner', async function () {
		const [owner] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 1, 0);

		expect(await event.owner()).to.equal(owner.address);

		const ownerBalance = await event.balanceOf(owner.address);
		expect(await event.totalSupply()).to.equal(ownerBalance);
	});
});

describe('Safe Mint', function () {
	it('Owner should be able to mint a new Token for free', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 1, 0);

		await expect(event.safeMint(owner.address, 1)).to.changeEtherBalance(owner, 0);
		expect(await event.totalSupply()).to.equal(1);
		expect(await event.ownerOf(0)).to.equal(owner.address);
		expect(await event.balanceOf(owner.address)).to.equal(1);
		expect(await event.tokenURI(0)).to.equal(
			`ipfs://${process.env.EXAMPLE_CID}/1.json`
		);

		await expect(event.safeMint(account1.address, 10)).to.changeEtherBalance(owner, 0);
		expect(await event.totalSupply()).to.equal(2);
		expect(await event.ownerOf(1)).to.equal(account1.address);
		expect(await event.tokenURI(1)).to.equal(
			`ipfs://${process.env.EXAMPLE_CID}/10.json`
		);
	});

	it('Non-owner should be able to mint a new Token with a fee', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option = {value: 1e9};

		await expect(event.connect(account1).safeMint(account1.address, 1, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value]);
		expect(await event.totalSupply()).to.equal(1);
		expect(await event.ownerOf(0)).to.equal(account1.address);
		expect(await event.tokenURI(0)).to.equal(
			`ipfs://${process.env.EXAMPLE_CID}/1.json`
		);

		await expect(event.connect(account1).safeMint(owner.address, 10, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value]);
		expect(await event.totalSupply()).to.equal(2);
		expect(await event.ownerOf(1)).to.equal(owner.address);
		expect(await event.tokenURI(1)).to.equal(
			`ipfs://${process.env.EXAMPLE_CID}/10.json`
		);
	});

	it('Non-owner should be able to mint a new Token with a fee (no change)', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option = {value: 1e10}; // Value != price

		await expect(event.connect(account1).safeMint(account1.address, 1, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value]);
		expect(await event.totalSupply()).to.equal(1);
		expect(await event.ownerOf(0)).to.equal(account1.address);
		expect(await event.tokenURI(0)).to.equal(
			`ipfs://${process.env.EXAMPLE_CID}/1.json`
		);

		await expect(event.connect(account1).safeMint(owner.address, 10, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value]);
		expect(await event.totalSupply()).to.equal(2);
		expect(await event.ownerOf(1)).to.equal(owner.address);
		expect(await event.tokenURI(1)).to.equal(
			`ipfs://${process.env.EXAMPLE_CID}/10.json`
		);
	});

	it('Non-owner should not be able to mint a new Token with insufficent fee', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option = {value: 1e8};

		const balanceStartOwner = await owner.getBalance();
		const balanceStartAcc1 = await account1.getBalance();

		await expect(event.connect(account1).safeMint(account1.address, 1, option)).to.be.revertedWith(
			"Value sent must be greater than price"
		);

		expect(await owner.getBalance()).eq(balanceStartOwner); //Owner must not get money
		expect((await account1.getBalance()).sub(balanceStartAcc1)).lessThan(option.value); //Account must not lose money
	});
});

describe('Duplicate Token URI', function () {
	it('Should not be able to mint sold Token URIs', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 1, 0);

		await event.safeMint(owner.address, 1);
		expect(await event.totalSupply()).to.equal(1);
		expect(await event.ownerOf(0)).to.equal(owner.address);
		expect(await event.tokenURI(0)).to.equal(
			`ipfs://${process.env.EXAMPLE_CID}/1.json`
		);
		
		await expect(event.safeMint(account1.address, 1)).to.be.revertedWith(
			"This ticket has already been sold"
		);
	});
});

describe('Invalid Token URI', function () {
	it('URI cannot be greater than noOfTokens', async function () {
		const [owner] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 1, 0);

		await expect(event.safeMint(owner.address, 11)).to.be.revertedWith(
			"Invalid token uri"
		);
	});

	it('URI cannot be less than 1', async function () {
		const [owner] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 1, 0);

		await expect(event.safeMint(owner.address, 0)).to.be.revertedWith(
			"Invalid token uri"
		);
	});
});

describe('Mint Exceed Ticket Ownable Limit', function() {
	it('Max Ownable Limit = 1, buyer mint for self', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 1, 0);

		const option = {value: 1e9};

		await expect(event.connect(account1).safeMint(account1.address, 1, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value])
		await expect(event.connect(account1).safeMint(account1.address, 2, option)).to.be.revertedWith(
			"This address owned maximum number of tickets"
		);
	});

	it('Max Ownable Limit = 2, buyer mint for self', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option = {value: 1e9};

		await expect(event.connect(account1).safeMint(account1.address, 1, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value]);
		await expect(event.connect(account1).safeMint(account1.address, 2, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value]);
		expect(await event.connect(account1).balanceOf(account1.address)).to.equal(2);
		await expect(event.connect(account1).safeMint(account1.address, 3, option)).to.be.revertedWith(
			"This address owned maximum number of tickets"
		);
	});

	it('Max Ownable Limit = 0 (no limit), buyer mint for self', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 3, 1e9, 0, 0);

		const option = {value: 1e9};

		for(var i = 1; i <= 3; i++){
			await expect(event.connect(account1).safeMint(account1.address, i, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value]);
		}

		expect(await event.balanceOf(account1.address)).to.equal(3);
	});

	it('Max Ownable Limit = 2, buyer mint for owner (no limit)', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 3, 1e9, 2, 0);

		const option = {value: 1e9};

		for(var i = 1; i <= 3; i++) {
			await expect(event.connect(account1).safeMint(owner.address, i, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value]);
		}

		expect(await event.balanceOf(owner.address)).to.equal(3);
	});

	it('Max Ownable Limit = 1, owner mint for self (no limit)', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 3, 1e9, 1, 0);

		for(var i = 1; i <= 3; i++){
			await expect(event.safeMint(owner.address, i)).to.changeEtherBalance(owner, 0);
		}

		expect(await event.balanceOf(owner.address)).to.equal(3);
	});
});

describe('Dynamic Ownable Limit', function() {
	it('Owner increases max Ownable Limit = 1,', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 1, 0);

		const option = {value: 1e9};

		await expect(event.connect(account1).safeMint(account1.address, 1, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value])
		await expect(event.connect(account1).safeMint(account1.address, 2, option)).to.be.revertedWith(
			"This address owned maximum number of tickets"
		);

		await event.setMaxTicketLimit(2);
		expect(await event.maxTicketsOwnable()).to.equal(2);

		await expect(event.connect(account1).safeMint(account1.address, 2, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value])
		await expect(event.connect(account1).safeMint(account1.address, 3, option)).to.be.revertedWith(
			"This address owned maximum number of tickets"
		);
	});

	it('Owner decreases max Ownable Limit', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option = {value: 1e9};

		await expect(event.connect(account1).safeMint(account1.address, 1, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value])
		await expect(event.connect(account1).safeMint(account1.address, 2, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value])
		

		await event.setMaxTicketLimit(1);
		expect(await event.maxTicketsOwnable()).to.equal(1);

		await expect(event.connect(account1).safeMint(account1.address, 3, option)).to.be.revertedWith(
			"This address owned maximum number of tickets"
		);
	});

	it('Owner decreases then increases max Ownable Limit', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option = {value: 1e9};

		await expect(event.connect(account1).safeMint(account1.address, 1, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value])
		await expect(event.connect(account1).safeMint(account1.address, 2, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value])
		
		await event.setMaxTicketLimit(1);
		expect(await event.maxTicketsOwnable()).to.equal(1);

		await expect(event.connect(account1).safeMint(account1.address, 3, option)).to.be.revertedWith(
			"This address owned maximum number of tickets"
		);

		await event.setMaxTicketLimit(2);
		expect(await event.maxTicketsOwnable()).to.equal(2);

		await expect(event.connect(account1).safeMint(account1.address, 3, option)).to.be.revertedWith(
			"This address owned maximum number of tickets"
		);

		await event.setMaxTicketLimit(3);
		expect(await event.maxTicketsOwnable()).to.equal(3);

		await expect(event.connect(account1).safeMint(account1.address, 3, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value])
	});

	it('Non-owner tries to set max Ownable Limit', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		await expect(event.connect(account1).setMaxTicketLimit(3)).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);
		expect(await event.maxTicketsOwnable()).to.equal(2);
	});
});

describe('Dynamic Pricing', function () {
	it('Owner increase price', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option = {value: 1e9};
		await expect(event.connect(account1).safeMint(account1.address, 1, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value]);

		await event.setPrice(1e10);
		expect(await event.ticketPriceWei()).to.equal(1e10);
		await expect(event.connect(account1).safeMint(owner.address, 2, option)).to.revertedWith(
			"Value sent must be greater than price"
		);

		option.value = 1e10;
		await expect(event.connect(account1).safeMint(account1.address, 2, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value]);
	});

	it('Owner decrease price', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option = {value: 1e9};
		await expect(event.connect(account1).safeMint(account1.address, 1, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value]);

		await event.setPrice(1e8);
		expect(await event.ticketPriceWei()).to.equal(1e8);
		await expect(event.connect(account1).safeMint(account1.address, 2, option)).to.changeEtherBalances([owner, account1], [option.value, -option.value]);

		option.value = 1e7;
		await expect(event.connect(account1).safeMint(owner.address, 3, option)).to.revertedWith(
			"Value sent must be greater than price"
		);
	});

	it('Non-owner tries to set price', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		await expect(event.connect(account1).setPrice(1e10)).to.be.revertedWith(
			"Ownable: caller is not the owner"
		);

		expect(await event.ticketPriceWei()).to.equal(1e9);
	});
});

describe('Get Resale Price', function () {
	it('Sucessful get resale price', async function() {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 1e9};

		// Mint 
		await expect(event.safeMint(owner.address, 1, {value: 0})).to.changeEtherBalance(owner, 0);
		expect(await event.getResalePrice(0)).to.equal(0);
	});
});

describe('Set Resale Price', function() {
	it('Successful set resale price', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 1e9};

		// Mint 
		await expect(event.safeMint(owner.address, 1, {value: 0})).to.changeEtherBalance(owner, 0);

		// Set Re-Sale Price
		await event.setResalePrice(0, 1e5);
		expect(await event.getResalePrice(0)).to.equal(1e5);

		// Mint 
		await expect(event.connect(account1).safeMint(account1.address, 2, option1)).to.changeEtherBalances([owner, account1], [option1.value, -option1.value]);

		// Set Re-Sale Price
		await event.connect(account1).setResalePrice(1, 1e5);
		expect(await event.getResalePrice(1)).to.equal(1e5);
	});

	it('Non-token-owner tries to set resale price', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 0};

		// Mint 
		await expect(event.safeMint(owner.address, 1, option1)).to.changeEtherBalance(owner, 0);

		// Set Re-Sale Price
		await expect(event.connect(account1).setResalePrice(0, 1e5)).to.revertedWith(
			"Only owner of this token can set its price"
		);
		expect(await event.getResalePrice(0)).to.equal(0);
	});

	it('Owner set resale price at maximum resale price', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 0};

		// Mint 
		await expect(event.safeMint(owner.address, 1, option1)).to.changeEtherBalance(owner, 0);

		await event.setMaximumResalePrice(1e5);
		expect(await event.maxResellPrice()).to.equal(1e5);

		// Set Re-Sale Price
		await event.setResalePrice(0, 1e5);
		expect(await event.getResalePrice(0)).to.equal(1e5);
	});

	it('Owner set resale price above maximum resale price', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 1e5);

		const option1 = {value: 0};

		// Mint 
		await expect(event.safeMint(owner.address, 1, option1)).to.changeEtherBalance(owner, 0);

		expect(await event.maxResellPrice()).to.equal(1e5);

		// Set Re-Sale Price
		await event.setResalePrice(0, 1e6);
		expect(await event.getResalePrice(0)).to.equal(1e6);
	});

	it('Non-Owner set resale price at maximum resale price', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 1e5);

		const option1 = {value: 1e9};

		// Mint 
		await expect(event.connect(account1).safeMint(account1.address, 1, option1)).to.changeEtherBalances([owner, account1], [option1.value, -option1.value]);

		expect(await event.maxResellPrice()).to.equal(1e5);

		// Set Re-Sale Price
		await event.connect(account1).setResalePrice(0, 1e5);
		expect(await event.getResalePrice(0)).to.equal(1e5);
	});

	it('Non-Owner set resale price above maximum resale price', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 1e5);

		const option1 = {value: 1e9};

		// Mint 
		await expect(event.connect(account1).safeMint(account1.address, 1, option1)).to.changeEtherBalances([owner, account1], [option1.value, -option1.value]);

		expect(await event.maxResellPrice()).to.equal(1e5);

		// Set Re-Sale Price
		await expect(event.connect(account1).setResalePrice(0, 1e6)).to.revertedWith(
			"Resale price must be less than specified price ceiling"
		);
		expect(await event.getResalePrice(0)).to.equal(0);
	});

	it('Non-Token-Owner try to set resale price of non existing token', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 1e9};

		// Mint 
		await expect(event.connect(account1).safeMint(account1.address, 1, option1)).to.changeEtherBalances([owner, account1], [option1.value, -option1.value]);

		// Set Re-Sale Price
		await expect(event.connect(account1).setResalePrice(1, 1e6)).to.revertedWith(
			"ERC721: invalid token ID"
		);
		expect(await event.getResalePrice(0)).to.equal(0);
	});

	it('Non-Token-Owner try to set resale price of others token', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 1e9};

		// Mint 
		await event.safeMint(owner.address, 1, {value:0});
		await expect(event.connect(account1).safeMint(account1.address, 2, option1)).to.changeEtherBalances([owner, account1], [option1.value, -option1.value]);

		// Set Re-Sale Price
		await expect(event.connect(account1).setResalePrice(0, 1e6)).to.revertedWith(
			"Only owner of this token can set its price"
		);
		expect(await event.getResalePrice(0)).to.equal(0);
		expect(await event.getResalePrice(1)).to.equal(0);
	});

	it('Decrease maximum resale price, remove non owner listings', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 1e9};

		// Mint 
		await event.safeMint(owner.address, 1, {value:0});
		await expect(event.connect(account1).safeMint(account1.address, 2, option1)).to.changeEtherBalances([owner, account1], [option1.value, -option1.value]);

		await event.setResalePrice(0, 1e5);
		await event.connect(account1).setResalePrice(1, 1e5);

		expect(await event.getResalePrice(0)).to.equal(1e5);
		expect(await event.getResalePrice(1)).to.equal(1e5);

		await event.setMaximumResalePrice(1e4);

		expect(await event.getResalePrice(0)).to.equal(1e5); // Owner ticket listing unchanged
		expect(await event.getResalePrice(1)).to.equal(0); // Non-Owner ticket listing changed
	});

	it('Increase maximum resale price, does not change listings', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 1e9};

		// Mint 
		await event.safeMint(owner.address, 1, {value:0});
		await expect(event.connect(account1).safeMint(account1.address, 2, option1)).to.changeEtherBalances([owner, account1], [option1.value, -option1.value]);

		await event.setResalePrice(0, 1e5);
		await event.connect(account1).setResalePrice(1, 1e5);

		expect(await event.getResalePrice(0)).to.equal(1e5);
		expect(await event.getResalePrice(1)).to.equal(1e5);

		await event.setMaximumResalePrice(1e6);

		expect(await event.getResalePrice(0)).to.equal(1e5); // Owner ticket listing unchanged
		expect(await event.getResalePrice(1)).to.equal(1e5); // Non-Owner ticket listing changed
	});

});

describe('Re-Selling Tickets', function () {
	it('Successful transfer from owner to buyer, No Royalty', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 0};
		const option2 = {value: 1e5};

		// Mint 
		await expect(event.safeMint(owner.address, 1, option1)).to.changeEtherBalance(owner, 0);

		// Set Re-Sale Price
		await event.setResalePrice(0, 1e5);
		expect(await event.getResalePrice(0)).to.equal(1e5);

		// Buy 
		await expect(event.connect(account1).transactTicket(owner.address, account1.address, 0, option2)).to.changeEtherBalances([owner, account1], [option2.value, -option2.value]);
	});

	it('Successful transfer from owner to buyer No Change, No Royalty', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 0};
		const option2 = {value: 1e6};

		// Mint 
		await expect(event.safeMint(owner.address, 1, option1)).to.changeEtherBalance(owner, 0);

		// Set Re-Sale Price
		await event.setResalePrice(0, 1e5);
		expect(await event.getResalePrice(0)).to.equal(1e5);

		// Buy 
		await expect(event.connect(account1).transactTicket(owner.address, account1.address, 0, option2)).to.changeEtherBalances([owner, account1], [option2.value, -option2.value]);
	});

	it('Failed transfer from owner to buyer (insufficient funds), No Royalty', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 0};
		const option2 = {value: 1e4};

		// Mint 
		await expect(event.safeMint(owner.address, 1, option1)).to.changeEtherBalance(owner, 0);

		// Set Re-Sale Price
		await event.setResalePrice(0, 1e5);
		expect(await event.getResalePrice(0)).to.equal(1e5);

		// Buy (Insufficient Funds)
		await expect(event.connect(account1).transactTicket(owner.address, account1.address, 0, option2)).to.revertedWith(
			"There must be sufficient funds to buy the token"
		);
	});

	it('Failed transfer from owner to buyer (max owned limit), No Royalty', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 0};
		const option2 = {value: 1e5};

		// Mint 
		await expect(event.safeMint(owner.address, 1, option1)).to.changeEtherBalance(owner, 0);
		await expect(event.safeMint(account1.address, 2, option1)).to.changeEtherBalance(owner, 0);
		await expect(event.safeMint(account1.address, 3, option1)).to.changeEtherBalance(owner, 0);

		// Set Re-Sale Price
		await event.setResalePrice(0, 1e5);
		expect(await event.getResalePrice(0)).to.equal(1e5);

		// Buy (exceed ownable limit)
		await expect(event.connect(account1).transactTicket(owner.address, account1.address, 0, option2)).to.revertedWith(
			"This address owned maximum number of tickets"
		);
	});

	it('Failed transfer from owner to buyer (ticket not for sale), No Royalty', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 0};
		const option2 = {value: 1e4};

		// Mint 
		await expect(event.safeMint(owner.address, 1, option1)).to.changeEtherBalance(owner, 0);

		// Buy (Didn't set sale)
		await expect(event.connect(account1).transactTicket(owner.address, account1.address, 2, option2)).to.revertedWith(
			"Token not set for sale"
		);
	});

	it('Failed transfer from owner to buyer (invalid token id), No Royalty', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 0};
		const option2 = {value: 1e5};

		// Mint 
		await expect(event.safeMint(owner.address, 1, option1)).to.changeEtherBalance(owner, 0);

		// Set Re-Sale Price
		await event.setResalePrice(0, 1e5);
		expect(await event.getResalePrice(0)).to.equal(1e5);

		// Buy (Invalid Token Id)
		await expect(event.connect(account1).transactTicket(owner.address, account1.address, 11, option2)).to.revertedWith(
			"Invalid token id"
		);
	});

	it('Failed transfer from buyer to buyer (from self to self), No Royalty', async function () {
		const [owner, account1] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 1e9};
		const option2 = {value: 1e5};

		// Mint 
		await expect(event.connect(account1).safeMint(account1.address, 1, option1)).to.changeEtherBalances([owner, account1], [option1.value, -option1.value]);

		// Set Re-Sale Price
		await event.connect(account1).setResalePrice(0, 1e5);
		expect(await event.connect(account1).getResalePrice(0)).to.equal(1e5);

		// Buy (Transfer to self)
		await expect(event.connect(account1).transactTicket(account1.address, account1.address, 0, option2)).to.revertedWith(
			"Can't perform transcation with same from and to address"
		);
	});

	it('Failed transfer from wrong owner to buyer, No Royalty', async function () {
		const [owner, account1, account2] = await ethers.getSigners();
		const Ticket = await ethers.getContractFactory('Ticket');
		const event = await Ticket.deploy(process.env.EXAMPLE_CID!, 10, 1e9, 2, 0);

		const option1 = {value: 1e9};
		const option2 = {value: 1e5};

		// Mint 
		await expect(event.connect(account1).safeMint(account1.address, 1, option1)).to.changeEtherBalances([owner, account1], [option1.value, -option1.value]);
		await event.safeMint(owner.address, 2, {value: 0});

		// Set Re-Sale Price
		await event.connect(account1).setResalePrice(0, 1e5);
		expect(await event.connect(account1).getResalePrice(0)).to.equal(1e5);

		await event.setResalePrice(1, 1e5);
		expect(await event.getResalePrice(1)).to.equal(1e5);

		// Buy (Transfer to self)
		await expect(event.connect(account2).transactTicket(account1.address, account2.address, 1, option2)).to.revertedWith(
			"ERC721: transfer from incorrect owner"
		);
	});
});