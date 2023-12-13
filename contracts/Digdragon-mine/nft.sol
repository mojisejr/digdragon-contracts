//SPDX-License-Identifier:MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";


contract NFT is ERC721Enumerable {

    constructor() ERC721("NFT", "NFT") {}

    //Token Counter
    uint256 currentTokenId = 0;
    function getCurrentTokenId() public view returns(uint256) {
        return currentTokenId + 1;
    }
    function _increaseTokenId() internal {
        currentTokenId += 1;
    }



    //Minter
    event Minted(uint256 _tokenId, address _to);
    function mint() public {
        uint256 tokenId = getCurrentTokenId(); 
        _mint(msg.sender, tokenId);
        _increaseTokenId();

        emit Minted(tokenId, msg.sender);
    } 


    function tokenURI(uint256 _tokenId) public override view returns(string memory) {
        return "https://gateway.freecity.finance/ipfs/QmNpFvgyGBQjDRu73mFCUSA1gXyANx67VDhDujGq3QgKpq";
    }
} 