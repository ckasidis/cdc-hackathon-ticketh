// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Ticket is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable{
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    string private cid;
    uint public noOfTickets;
    
    uint public maxTicketsOwnable;
    uint public ticketPriceWei;

    uint public maxResellPrice;

    address[] private uriOwners;
    //mapping(uint256 => uint) resalePrices; // Maps tokenId to resale price
    uint[] public resalePrices;

    bool pauseMint;
    bool pauseResale;

    constructor(string memory _cid, uint _noOfTickets, uint _ticketPriceWei, uint _maxTicketsOwnable, uint _maxResellPrice) ERC721("Ticket", "TKT") {
        cid = _cid;
        noOfTickets = _noOfTickets;
        uriOwners = new address[](_noOfTickets);
        resalePrices = new uint[](_noOfTickets);
        ticketPriceWei = _ticketPriceWei;
        maxTicketsOwnable = _maxTicketsOwnable;
        maxResellPrice = _maxResellPrice;

        pauseMint = false;
        pauseResale = false;
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
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
        
        string memory strUri = string.concat(Strings.toString(uri), ".json");
        _setTokenURI(tokenId, strUri);
        uriOwners[shiftedIndex] = to;

        resalePrices[tokenId] = 0;
    }

    function getUriOwners() external view returns (address[] memory) {
        return uriOwners;
    }

    function setPrice(uint newPriceWei) external onlyOwner {
        ticketPriceWei = newPriceWei;
    }

    function setMaxTicketLimit(uint newMaxTicketsOwnable) external onlyOwner {
        maxTicketsOwnable = newMaxTicketsOwnable;
    }

    function getResalePrice(uint tokenId) view external returns (uint){
        require(tokenId < noOfTickets, "Invalid token id");
        return resalePrices[tokenId];
    }

    function setResalePrice(uint tokenId, uint newResalePrice) external {
        require(msg.sender == ownerOf(tokenId), "Only owner of this token can set its price");
        require((newResalePrice <= maxResellPrice) || (maxResellPrice == 0) || (ownerOf(tokenId) == owner()), "Resale price must be less than specified price ceiling");
        resalePrices[tokenId] = newResalePrice;
    }

    /**
     * Buyer (to) must send sufficient funds to buyTicket to buy ticket from the seller (from)
     */
    function transactTicket(address from, address to, uint tokenId) external payable {
        require(tokenId < noOfTickets, "Invalid token id");
        require(resalePrices[tokenId] != 0, "Token not set for sale");
        require(from != to, "Can't perform transcation with same from and to address");
        _safeTransfer(from, to, tokenId, "");
        require(msg.value >= resalePrices[tokenId], "There must be sufficient funds to buy the token");
        payable(from).transfer(msg.value);
    }

    function setMaximumResalePrice(uint newMaxResellPrice) external onlyOwner{
        maxResellPrice = newMaxResellPrice;

        // Invalidate market listing
        for(uint i = 0; i < noOfTickets; i++) {
            if(resalePrices[i] > maxResellPrice && (ownerOf(i) != owner())) {
                resalePrices[i] = 0;
            }
        }
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
