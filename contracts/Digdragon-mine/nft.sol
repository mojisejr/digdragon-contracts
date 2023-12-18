//SPDX-License-Identifier:MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract NFT is ERC721Enumerable, Ownable {

    mapping(uint256 => string) tokenIdToBaseUri;
    mapping(address => uint256) whitelist;
    


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
        require(whitelist[msg.sender] > 0, 'you are not in the whitelist');

        uint256 tokenId = getCurrentTokenId(); 
        _deductMintedAmount(msg.sender);
        _mint(msg.sender, tokenId);
        _increaseTokenId();

        emit Minted(tokenId, msg.sender);
    } 

    function addWhitelist(address[] memory _users, uint256[] memory _amounts) public onlyOwner {
        require(_users.length == _amounts.length, 'invalid data input');

        for(uint256 i = 0; i < _users.length; i++) {
            whitelist[_users[i]] = _amounts[i];
        }
    }

    function _deductMintedAmount(address _user) internal {
        require(whitelist[_user] > 0, 'you have used up credit');
        --whitelist[_user];
    }


    
    function setBaseUri(uint256[] memory _tokenIds, string[] memory _baseUris) public onlyOwner {
        require(_tokenIds.length == _baseUris.length, 'invalid input data');

        for (uint256 i = 0; i < _tokenIds.length; i++) {
            tokenIdToBaseUri[_tokenIds[i]] = _baseUris[i];
        }
    }

    function tokenURI(uint256 _tokenId) public override view returns(string memory) {
        return tokenIdToBaseUri[_tokenId];
    }
} 