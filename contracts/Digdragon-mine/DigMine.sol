//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

interface IHashPowerStorage {
    function getHashPower(
        uint256 _tokenId
    ) external view returns (uint256 power);
}

contract DigDragonMine is ERC721Holder, ReentrancyGuard, Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    mapping(uint256 => uint256) hashpowers;

    IERC721 digdragon;
    IERC20 reward;
    IHashPowerStorage hashPowerStorage;

    error ZeroStakedHashPowerAmount();
    error ZeroStakedTokens();

    uint rewardPerBlock;
    uint startBlock;
    uint accTokenPerShare; // Accumulated Tokens per share, times 1e12.
    uint rewardsForWithdrawal;

    uint256 fee = 300; //3%
    address feeCollector;

    uint public totalHashPower;
    uint public lastRewardBlock;

    uint256 rewardEndBlock;

    struct Miner {
        uint[] stakedTokenIds;
        uint stakedHashPowerAmount;
    }

    mapping(address => Miner) miners;
    mapping(address => uint256) rewardDebt; //reward
    mapping(uint256 => uint256) tokenIdToHashPower;
    mapping(uint256 => bool) stakedTokens;

    constructor(
        IERC721 _digdragon,
        IERC20 _reward,
        IHashPowerStorage _hashPowerStorage,
        address _feeCollector,
        uint256 _startBlock,
        uint256 _rewardPerBlock,
        uint256 _rewardEndBlock
    ) {
        digdragon = _digdragon;
        reward = _reward;
        rewardEndBlock = _rewardEndBlock;
        hashPowerStorage = _hashPowerStorage;
        startBlock = _startBlock;
        rewardPerBlock = _rewardPerBlock;
        feeCollector = _feeCollector;
    }

    function setFeeCollector(address _collector) external onlyOwner {
        feeCollector = _collector;
    }

    function _calculateFee(
        uint256 _pendingReward
    ) internal view returns (uint256 feeRate, uint256 payout) {
        feeRate = (_pendingReward * fee) / 10_000;
        payout = _pendingReward - feeRate;
    }

    event HashPowerStorageChanged(address newStorage);

    function setHashPowerStorage(IHashPowerStorage _storage) public onlyOwner {
        require(
            address(_storage) != address(0),
            "setHashPowerStorage: Invalid address"
        );
        hashPowerStorage = _storage;

        emit HashPowerStorageChanged(address(_storage));
    }

    event RewardDistributionStopped(uint256 stopBlock);

    function stopRewardDistribution() external onlyOwner {
        rewardEndBlock = block.number;

        emit RewardDistributionStopped(block.number);
    }

    event NewRewardEndBlockSet(uint256 _newRewardBlock);

    function setRewardEndBlock(uint256 _rewardEndBlock) external onlyOwner {
        require(
            _rewardEndBlock > block.number,
            "setRewardEndBlock: reward end block must be greater than current block"
        );
        rewardEndBlock = _rewardEndBlock;

        emit NewRewardEndBlockSet(_rewardEndBlock);
    }

    event NewStartBlockSet(uint256 _startBlock);

    function setStartBlock(uint256 _startBlock) external onlyOwner {
        if (_startBlock == 0) {
            startBlock = block.number + 1;
        }
        require(
            _startBlock > block.number,
            "setStartBlock: must be later than current block number"
        );
        startBlock = _startBlock;

        emit NewStartBlockSet(_startBlock);
    }

    event NewRewardPerBlockSet(uint256 _newRewardPerBlock);

    function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        require(
            _rewardPerBlock > 0,
            "setRewardPerBlock: must be greater than 0 per block"
        );
        rewardPerBlock = _rewardPerBlock;

        emit NewRewardEndBlockSet(_rewardPerBlock);
    }

    event SetNewMiner(address miner);

    function setMinerAddress(address _miner) external onlyOwner {
        require(_miner != address(0), "setMinerAddress: invalid miner address");
        digdragon = IERC721(_miner);

        emit SetNewMiner(_miner);
    }

    function getUserStakedTokens(
        address _miner
    ) public view returns (uint[] memory) {
        return miners[_miner].stakedTokenIds;
    }

    function getuserStakedHashPowerAmount(
        address _miner
    ) public view returns (uint) {
        return miners[_miner].stakedHashPowerAmount;
    }

    //////////
    // Update reward variables of the given pool to be up-to-date. */
    //////////

    function updatePool() public {
        uint multiplier = getMultiplier(lastRewardBlock, block.number);
        uint _totalHashPower = totalHashPower;

        if (multiplier == 0) return;
        lastRewardBlock = block.number;
        if (_totalHashPower == 0) return;

        uint calculatedReward = rewardPerBlock * multiplier;
        rewardsForWithdrawal += calculatedReward;
        accTokenPerShare += (calculatedReward * 1e12) / _totalHashPower;
    }

    function getMultiplier(
        uint256 _from,
        uint256 _to
    ) public view returns (uint) {
        //if distribution not at the rewardEndBlock;
        if (_to <= rewardEndBlock) {
            (bool result, uint256 data) = _to.trySub(_from);
            return data;
        } else if (_from >= rewardEndBlock) {
            return 0;
        } else {
            (bool result, uint256 data) = rewardEndBlock.trySub(_from);
            return data;
        }
    }

    function pendingReward(
        address _miner
    ) external view returns (IERC20, uint) {
        Miner memory miner = miners[_miner];
        uint calculatedReward = 0;

        if (miner.stakedHashPowerAmount == 0) {
            return (reward, 0);
        }

        uint _totalHashPower = totalHashPower;
        uint multiplier = getMultiplier(lastRewardBlock, block.number);
        uint _accTokenPerShare = 0;
        if (multiplier != 0 && _totalHashPower != 0) {
            _accTokenPerShare =
                accTokenPerShare +
                ((multiplier * rewardPerBlock * 1e12) / _totalHashPower);
        } else {
            _accTokenPerShare = accTokenPerShare;
        }

        calculatedReward =
            ((miner.stakedHashPowerAmount * _accTokenPerShare) / 1e12) -
            rewardDebt[_miner];
        return (reward, calculatedReward);
    }

    function withdrawReward() public nonReentrant {
        _withdrawReward();
    }

    function _withdrawReward() internal {
        updatePool();
        Miner memory miner = miners[msg.sender];

        if (miner.stakedHashPowerAmount == 0) return;
        uint pending = (miner.stakedHashPowerAmount * accTokenPerShare) /
            1e12 -
            rewardDebt[msg.sender];
        rewardsForWithdrawal -= pending;
        (uint256 feeRate, uint256 payout) = _calculateFee(pending);
        // rewardDebt[msg.sender] = miner.stakedHashPowerAmount * accTokenPerShare / 1e12;
        IERC20(reward).safeTransfer(feeCollector, feeRate);
        IERC20(reward).safeTransfer(msg.sender, payout);
    }

    function _updateRewardDebt(address _miner) internal {
        rewardDebt[_miner] =
            (miners[_miner].stakedHashPowerAmount * accTokenPerShare) /
            1e12;
    }

    function _removeMiner(uint _index, address _miner) internal {
        uint[] storage tokenIds = miners[_miner].stakedTokenIds;
        tokenIds[_index] = tokenIds[tokenIds.length - 1];
        tokenIds.pop();
    }

    function _updateStakedToken(uint256 _tokenId, bool _value) internal {
        stakedTokens[_tokenId] = _value;
    }

    event Staked(address indexed owner, uint[] tokenIds);

    function stake(uint[] calldata _tokenIds) public nonReentrant {
        _withdrawReward();
        uint depositedHashPower = 0;
        for (uint i = 0; i < _tokenIds.length; i++) {
            require(
                IERC721(digdragon).ownerOf(_tokenIds[i]) == msg.sender,
                "stake: Not token owner"
            );
            require(!stakedTokens[_tokenIds[i]], "stake: This token is staked");

            IERC721(digdragon).transferFrom(
                msg.sender,
                address(this),
                _tokenIds[i]
            );
            _updateStakedToken(_tokenIds[i], true);

            uint256 _hashPower = hashPowerStorage.getHashPower(_tokenIds[i]);
            //used for calculation loop during withdraw
            tokenIdToHashPower[_tokenIds[i]] = _hashPower;
            depositedHashPower += _hashPower;
            miners[msg.sender].stakedTokenIds.push(_tokenIds[i]);
        }

        if (depositedHashPower > 0) {
            miners[msg.sender].stakedHashPowerAmount += depositedHashPower;
            totalHashPower += depositedHashPower;
        }

        _updateRewardDebt(msg.sender);

        emit Staked(msg.sender, _tokenIds);
    }

    event Unstaked(address indexed owner, uint[] tokenIds);

    function unstake(uint[] calldata _tokenIds) public nonReentrant {
        Miner storage miner = miners[msg.sender];
        require(
            miner.stakedTokenIds.length >= _tokenIds.length,
            "unstake: Invalid input tokens"
        );
        uint withdrawalHashPower = 0;
        _withdrawReward();
        bool tokenFound;
        for (uint i = 0; i < _tokenIds.length; i++) {
            tokenFound = false;
            for (uint j = 0; j < miner.stakedTokenIds.length; j++) {
                if (_tokenIds[i] == miner.stakedTokenIds[j]) {
                    withdrawalHashPower += tokenIdToHashPower[_tokenIds[i]]; //getHashPower(tokenIds[i]);
                    _removeMiner(j, msg.sender);
                    IERC721(digdragon).transferFrom(
                        address(this),
                        msg.sender,
                        _tokenIds[i]
                    );
                    _updateStakedToken(_tokenIds[i], false);

                    tokenFound = true;
                    break;
                }
            }
            require(tokenFound, "unstake: Token not staked by miner");
        }

        if (withdrawalHashPower > 0) {
            miner.stakedHashPowerAmount -= withdrawalHashPower;
            totalHashPower -= withdrawalHashPower;
            _updateRewardDebt(msg.sender);
        }

        emit Unstaked(msg.sender, _tokenIds);
    }

    // Withdraw without caring about rewards. EMERGENCY ONLY.
    event EmergencyUnstaked();

    function emergencyUnstake(address _owner) public nonReentrant onlyOwner {
        uint[] memory tokenIds = miners[_owner].stakedTokenIds;
        if (tokenIds.length <= 0) revert ZeroStakedTokens();
        totalHashPower -= miners[_owner].stakedHashPowerAmount;
        delete miners[_owner];
        delete rewardDebt[_owner];
        for (uint i = 0; i < tokenIds.length; i++) {
            IERC721(digdragon).transferFrom(address(this), _owner, tokenIds[i]);
            _updateStakedToken(tokenIds[i], false);
        }

        emit EmergencyUnstaked();
    }

    // Withdraw reward token. EMERGENCY ONLY.
    event EmergencyRewardWithDrawn();

    function emergencyRewardTokenWithdraw(
        address _token,
        uint256 _amount
    ) public onlyOwner {
        require(
            IERC20(_token).balanceOf(address(this)) >= _amount,
            "emergencyRewardWithDrawn: Insufficient Balance"
        );
        IERC20(_token).safeTransfer(msg.sender, _amount);

        emit EmergencyRewardWithDrawn();
    }

    function getHashPower(
        uint256 _tokenId
    ) internal view returns (uint256 hashPower) {
        hashPower = IHashPowerStorage(hashPowerStorage).getHashPower(_tokenId);
    }

    function getUserInfo(
        address _miner
    ) public view returns (Miner memory userInfo) {
        userInfo = miners[_miner];
    }

    function getRewardDebt(
        address _miner
    ) public view returns (uint256 amount) {
        amount = rewardDebt[_miner];
    }

    function totalStakedTokens() public view returns (uint256) {
        return digdragon.balanceOf(address(this));
    }

    struct MineInfo {
        address digdragon;
        address reward;
        address hashStorage;
        address feeCollector;
        uint256 fee;
        uint256 startBlock;
        uint256 rewardEndBlock;
        uint256 rewardPerBlock;
        uint256 accTokenPerShare;
        uint256 rewardsForWithdrawal;
        uint256 totalStakedTokens;
        uint256 totalHashPower;
    }

    function getMineInfo() public view returns (MineInfo memory info) {
        info = MineInfo(
            address(digdragon),
            address(reward),
            address(hashPowerStorage),
            address(feeCollector),
            fee,
            startBlock,
            rewardEndBlock,
            rewardPerBlock,
            accTokenPerShare,
            rewardsForWithdrawal,
            totalStakedTokens(),
            totalHashPower
        );
    }
}
