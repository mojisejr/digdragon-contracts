//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// import "hardhat/console.sol";


contract HashPowerStorage {

    mapping(address => mapping(uint256 => uint256)) addressToTokenIdHashPower;

    constructor(address _nft, uint256[] memory tokenIds, uint256[] memory hashPowers) {
        for(uint256 i = 0; i < tokenIds.length; i++)  {
            addressToTokenIdHashPower[_nft][tokenIds[i]] = hashPowers[i];
        }
    }

    function getHashPower(address assetAddress, uint256 tokenID) external view returns(uint256 power) {
         uint256 hp =  addressToTokenIdHashPower[assetAddress][tokenID];
         return hp; 
    }
}