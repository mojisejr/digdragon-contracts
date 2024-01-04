//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";

contract DigDragonPowerStorage is Ownable {
    mapping(uint256 => uint256) private tokenIdToHashPower;

    constructor(uint256[] memory tokenIds, uint256[] memory hashPowers) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            tokenIdToHashPower[tokenIds[i]] = hashPowers[i];
        }
    }

    function getHashPower(
        uint256 _tokenId
    ) external view returns (uint256 power) {
        return tokenIdToHashPower[_tokenId];
    }

    function setHashPowerOf(
        uint256 _tokenId,
        uint256 _newHashPower
    ) public onlyOwner {
        require(
            _newHashPower > 0,
            "setHashPowerOf: new hash power must be grater than 0"
        );
        tokenIdToHashPower[_tokenId] = _newHashPower;
    }

    function setHashPowerOfBatch(
        uint256[] memory _tokenIds,
        uint256[] memory _newHashPower
    ) public onlyOwner {
        require(
            _tokenIds.length == _newHashPower.length,
            "setHashPowerOfBatch: invalid input value"
        );

        for (uint256 i = 0; i < _tokenIds.length; i++) {
            tokenIdToHashPower[_tokenIds[i]] = _newHashPower[i];
        }
    }
}
