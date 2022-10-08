// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Ticket is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    string private cid;
    uint public noOfTickets;
    address[] private uriOwners;
    uint public maxTicketsOwnable;
    uint public ticketPriceWei;
    uint[] private resalePrices;

    constructor(string memory _cid, uint _noOfTickets, uint _ticketPriceWei, uint _maxTicketsOwnable) ERC721("Ticket", "TKT") {
        cid = _cid;
        noOfTickets = _noOfTickets;
        uriOwners = new address[](_noOfTickets);
        ticketPriceWei = _ticketPriceWei;
        maxTicketsOwnable = _maxTicketsOwnable;
        resalePrices = new uint[](_noOfTickets);
    }

    function _baseURI() internal view override returns (string memory) {
        return string.concat("ipfs://", cid, '/');
    }

    function safeMint(address to, uint uri) public payable {

        // Check if index is valid
        require(uri >= 1 && uri <= noOfTickets, "Invalid token uri");
        uint shiftedIndex = uri - 1;

        // Check if index is minted
        require(uriOwners[shiftedIndex] == address(0), "This ticket has already been sold");
        
        // Owner get to mint tickets for free
        address ownerAddr = owner();
        if(msg.sender != ownerAddr) {
            require(msg.value >= ticketPriceWei, "Value sent must be greater than price");
            payable(ownerAddr).transfer(msg.value); // Does not return change to buyer
        }

        uint256 tokenId = _tokenIdCounter.current();
        _safeMint(to, tokenId); // Safe mint might fail so increment after success only
        _tokenIdCounter.increment();
        
        string memory strUri = string.concat(Strings.toString(uri), ".json");
        _setTokenURI(tokenId, strUri);
        uriOwners[shiftedIndex] = to;
    }

    function getUriOwners() external view returns (address[] memory) {
        return uriOwners;
    }

    function setPrice(uint newPriceWei) external {
        _checkOwner();
        ticketPriceWei = newPriceWei;
    }

    function setMaxTicketLimit(uint newMaxTicketsOwnable) external {
        _checkOwner();
        maxTicketsOwnable = newMaxTicketsOwnable;
    }

    // The following functions are overrides required by Solidity.

    function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        virtual
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);

        // Check if owner balance exceed max
        uint256 toBalance = balanceOf(to);
        require( (toBalance < maxTicketsOwnable) || (maxTicketsOwnable == 0) || (owner() == to), "This address owned maximum number of tickets");
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
