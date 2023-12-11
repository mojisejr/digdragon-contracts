//SPDX-License-Identifier:MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "hardhat/console.sol";



interface IHashPowerStorage {
    function getHashPower(address assetAddress, uint256 tokenID) external view returns(uint256 power);
    function getCumulativeHashPower(address assetAddress, uint256 tokenID) external view returns(uint256 power);
}


contract Mine is  ERC721Holder, Ownable {

    using Math for uint256;

    constructor(IERC721 _nft, IERC20 _rewardToken, IHashPowerStorage _hashPowerStorage) { 
        nft = _nft;
        rewardToken = _rewardToken;
        hashPowerStorage  = _hashPowerStorage;
    }

    //Staking    
    struct Miner {  
        address owner;
        uint256 entered;
        uint256 leave;
        bool mining;
    }

    IERC721 nft;
    function setNftAddress(IERC721 _nft) external onlyOwner {
        require(address(_nft) != address(0), 'Invalid nft address');
        nft = _nft;
    }


    IHashPowerStorage hashPowerStorage;
    mapping(uint256 => Miner) public miner; 
    mapping(address => uint256[]) public addressToMining;
    mapping(address => uint256) public addressToHashPowerSum;
    uint256 public totalHashPower = 0;
    uint256 public totalMiners = 0;

    uint256 public startBlock = 0;
    uint256 public endBlock = 0;
    uint256 public startTime  = 0;
    uint256 public endTime = 0;
    bool public close = true;

    event SetMiningTime(uint256 startBlock, uint256 startTime, uint256 endBlock, uint256 endTime);
    function setMiningTime(uint256 _startBlock, uint256 _startTime,  uint256 _endBlock, uint256 _endTime) external onlyOwner {
        require(_startBlock < _endBlock, 'Start block number must be greater than End block number');
        // require(_startBlock >= block.number, 'invalid block number');
        startBlock = _startBlock;
        startTime = _startTime;
        endBlock = _endBlock;
        endTime = _endTime;
        close = false;

        emit SetMiningTime(_startBlock, _startTime, _endBlock, _endTime);
    }

    function setClose(bool _value) external onlyOwner {
        close = _value;
    }

    modifier whenOpen() {
        require(block.number < endBlock, 'Avalible only when mining is open');
        require(block.timestamp < endTime, 'Avaliable only when mining is open');
        require(close == false, 'Mine is now closed');
        _;
    }

    modifier whenClose() {
        require(close == true, 'Mine is opening');
        _;
    }

    event EnteredMine(address indexed owner, uint256 tokenId); //event
    function enterMine(uint256[] memory _tokenIds) external whenOpen { 

        for(uint256 i = 0 ; i < _tokenIds.length; i++) {
            require(nft.ownerOf(_tokenIds[i]) == msg.sender, "Not the owner of NFT." );
            require(!miner[_tokenIds[i]].mining, "Token is already in Mine.");

            nft.safeTransferFrom(msg.sender, address(this), _tokenIds[i]);
            _mining(_tokenIds[i], msg.sender);

            emit EnteredMine(msg.sender, _tokenIds[i]);
        }

    }

    event Mining(address indexed owner, uint256 tokenId, uint256 entered);
    function _mining(uint256 _tokenId, address _owner) internal {
        require(!miner[_tokenId].mining, "Token is already in Mine");

        miner[_tokenId].owner = _owner;
        miner[_tokenId].mining  = true;
        miner[_tokenId].entered = block.number;
        addressToMining[msg.sender].push(_tokenId);
        _incHashPowerSum(_tokenId, _owner);
        _incTotalMiner(); 

        emit Mining(msg.sender, _tokenId, block.timestamp);
    }

    event ExistedMine(address indexed owner,  uint256 tokenId);
    function existMine(uint256[] memory _tokenIds) external {
        for(uint256 i = 0; i < _tokenIds.length; i++) {
            require(miner[_tokenIds[i]].owner == msg.sender, "Not the owner of NFT.");
            require(miner[_tokenIds[i]].mining, "Token is not in Mine.");

        
            nft.safeTransferFrom(address(this), msg.sender, _tokenIds[i]);
            _existing(_tokenIds[i], msg.sender);

            emit ExistedMine(msg.sender, _tokenIds[i]);
        }
    }

    event Existing(address indexed owner, uint256 tokenId, uint256 leave);
    function _existing(uint256 _tokenId, address _owner) internal {
        require(miner[_tokenId].mining, "Token is not in Mine");
        require(addressToMining[_owner].length > 0, "Nothing In Mine");

        uint256 tokenIndex  = _indexOf(_tokenId, _owner);
        console.log("index of %s", tokenIndex);
        require(tokenIndex != 99999, "Cannot Find TokenId Index");

        console.log("token id %s", _tokenId);

        //release reward
        _releaseRewardOfToken(_owner, _tokenId);


        //update mining information
        miner[_tokenId].owner = _owner;
        miner[_tokenId].mining  = false;
        miner[_tokenId].leave = block.number;
        miner[_tokenId].entered = 0;
        _removeFromMiningList(tokenIndex, _owner);
        _decHashPowerSum(_tokenId, _owner);
        _decTotalMiner();

        emit Existing(msg.sender, _tokenId, block.timestamp);
    }

    function _incHashPowerSum(uint256 _tokenId, address _owner) internal {
        uint256 tokenHashPower = hashPowerStorage.getHashPower(address(nft), _tokenId);
        addressToHashPowerSum[_owner] += tokenHashPower;
        totalHashPower += tokenHashPower;
    }

    function _decHashPowerSum(uint256 _tokenId, address _owner) internal {
        uint256 tokenHashPower = hashPowerStorage.getHashPower(address(nft), _tokenId);
        addressToHashPowerSum[_owner] -= tokenHashPower;
        totalHashPower -= tokenHashPower;
    }

    function _incTotalMiner() internal {
        totalMiners ++;
    }
    function _decTotalMiner() internal {
        totalMiners --;
    }

    function _removeFromMiningList(uint256 _index, address _owner) internal {
        addressToMining[_owner][_index] = addressToMining[_owner][addressToMining[_owner].length - 1];
        addressToMining[_owner].pop();
    }

    function _indexOf(uint256 _tokenId, address _owner) internal view returns(uint256) {
        for(uint256 i = 0; i < addressToMining[_owner].length; i ++) {
            if(addressToMining[_owner][i] == _tokenId) {
                return i;
            }
        }
        return 99999;
    }

    //Reward
    uint256 public rewardPerBlock = 100 * 10 ** 18;
    event SetRewardPerBlock(uint256 rewardPerBlock);
    function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner whenClose {
        require(_rewardPerBlock != 0, "Invalid Reward Per Block");
        rewardPerBlock = _rewardPerBlock;

        emit SetRewardPerBlock(_rewardPerBlock);
    }

    IERC20 public rewardToken;
    event SetRewardToken(IERC20 token);
    function setRewardToken(IERC20 _rewardToken) external onlyOwner whenClose {
        require(address(_rewardToken) != address(0), 'Invalid reward token');
        rewardToken = _rewardToken;

        emit SetRewardToken(_rewardToken);
    }



    function pendingRewardOf(address _owner) public view returns(uint256) {
        uint256[] memory tokenIds = addressToMining[_owner];
        uint256 pendingReward = 0;

         for(uint256 i = 0; i < tokenIds.length; i++) {
            uint256 rewardOfToken =  _calculateRewardDeptOfToken(tokenIds[i]);
            console.log("pending reward of %s = %s", tokenIds[i], rewardOfToken);
            pendingReward += rewardOfToken;
        }

        console.log("pending reward: %s", pendingReward);

        

        return pendingReward;
    }

    event RewardAdded(uint256 amount);
    function addReward(uint256 _amount) external onlyOwner {
        require(address(rewardToken) != address(0), 'Invalid reward token');
        rewardToken.transferFrom(msg.sender, address(this), _amount);

        emit RewardAdded(_amount);
    }
   

    function _calculateRewardDeptOfToken(uint256 _tokenId) internal view returns(uint256) {
        uint256 totalRewardBlocks = block.number - miner[_tokenId].entered;
        console.log("block number: %s", block.number);
        console.log("total block: %s", totalRewardBlocks);
        console.log("total hashpower: %s", totalHashPower);
        uint256 tokenHashPower  = hashPowerStorage.getHashPower(address(nft), _tokenId);
        console.log("token hashpower: %s", tokenHashPower); 
        uint256 rewards = _calculateReward(totalRewardBlocks, tokenHashPower);
        return rewards; 
    }

    function _calculateReward(uint256 _totalRewardBlocks, uint256 _tokenHashPower) internal view returns(uint256) {
        uint256 percentShare = (_tokenHashPower * 100) / totalHashPower;
        uint256 share = rewardPerBlock * percentShare / 100;
        uint256 calculated = share * _totalRewardBlocks;
        console.log("percentShare: %s", percentShare);
        console.log("sharePerBlock: %s",  share);
        console.log("calculated: %s", calculated);
        return calculated;
    }

    event RewardReleased(address indexed owner, uint256 tokenId, uint256 rewards);
    function _releaseRewardOfToken(address _owner, uint256 _tokenId) internal {
        require(address(rewardToken) != address(0), 'Invalid reward token');
        uint256 rewards = _calculateRewardDeptOfToken(_tokenId);
        console.log("tokeknId %s [%s]",_tokenId, rewards);
        require(rewards > 0, 'Invalid Reward Amount');
        require(rewardToken.balanceOf(address(this)) >= rewards, 'Not Enough Token To Be Paid');

        //transfer reward to owner of token
       rewardToken.transfer(_owner, rewards);

       emit RewardReleased(_owner, _tokenId, rewards);
    }


    //Emergency Functions
    event EmergencyWithdrawnTokens(address[] _to, uint256[] _tokenIds);
    function EmergencyWithdrawToken(address[] memory _to, uint256[] memory _tokenIds) external onlyOwner { 
        require(_to.length == _tokenIds.length, "Invalid Input Data");
        for(uint256 i = 0; i < _to.length; i++) {
            nft.safeTransferFrom(address(this), _to[i], _tokenIds[i]);
        }

        emit EmergencyWithdrawnTokens(_to, _tokenIds);
    }

    event EmergencyWithdrawnERC20(IERC20 erc20, uint256 amount);
    function EmergencyWithdrawERC20(IERC20 erc20, uint256 _amount) external onlyOwner {
        require(erc20.balanceOf(address(this)) > 0, 'Contract is empty');

        if(_amount <= 0) {
            erc20.transferFrom(address(this), owner(), erc20.balanceOf(address(this)));
            emit EmergencyWithdrawnERC20(erc20, erc20.balanceOf(address(this)));
        } else {
            erc20.transferFrom(address(this), owner(), _amount);
            emit EmergencyWithdrawnERC20(erc20, _amount);
        }
    }

    event EmergencyWithdrawnKUB(uint256 _amount);
    function EmergencyWithdrawKub() external onlyOwner {
        require(address(this).balance > 0, 'Contract is empty');

        (bool sent, bytes memory data) = address(this).call{value: address(this).balance}("");
        require(sent, "Failed to send Kub"); 

        emit EmergencyWithdrawnKUB(address(this).balance);
    }
}