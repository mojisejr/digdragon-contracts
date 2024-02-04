//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract StakingContract {
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    address public owner;

    uint public duration;
    uint public finishAt;
    uint public updatedAt;
    uint public rewardRate;
    uint public rewardPerTokenStored;
    mapping(address => uint) public userRewardPerTokenPaid;
    mapping(address => uint) public rewards;

    uint public totalSupply;

    mapping(address => uint) public balanceOf;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        updatedAt = lastTimeRewardApplicable();

        if (_account != address(0)) {
            rewards[_account] = earned(_account);
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }
        _;
    }

    constructor(address _stakingToken, address _rewardToken) {
        owner = msg.sender;
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
    }

    function setRewardDuration(uint _duration) external onlyOwner {
        require(finishAt < block.timestamp, "reward duration still on going");
        duration = _duration;
    }

    function notifyRewardAmount(
        uint _amount
    ) external updateReward(address(0)) {
        //set reward rate and send reward to contract
        if (block.timestamp > finishAt) {
            // this is for the start or ended distribution
            rewardRate = _amount / duration;
        } else {
            // if the distribution is not ended.
            uint remainingReward = rewardRate * (finishAt - block.timestamp); // calculate remaining reward
            rewardRate = (remainingReward * _amount) / duration;
        }

        require(rewardRate > 0, "reward rate = 0");
        require(
            rewardRate * duration <= rewardToken.balanceOf(address(this)),
            "reward amount > balance"
        );

        finishAt = block.timestamp + duration;
        updatedAt = block.timestamp;
    }

    function stake(uint _amount) external updateReward(msg.sender) {
        require(_amount > 0, "amount = 0");

        stakingToken.transferFrom(msg.sender, address(this), _amount);
        balanceOf[msg.sender] += _amount;
        totalSupply += _amount;
    }

    function unstake(uint _amount) external updateReward(msg.sender) {
        require(_amount > 0, "amount = 0");
        stakingToken.transfer(msg.sender, _amount);
    }

    function lastTimeRewardApplicable() public view returns (uint) {
        return _min(block.timestamp, finishAt);
    }

    function rewardPerToken() public view returns (uint) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }
        return
            rewardPerTokenStored +
            (rewardRate * (lastTimeRewardApplicable() - updatedAt) * 1e18) /
            totalSupply;
    }

    function earned(address _staker) public view returns (uint) {
        return
            (balanceOf[_staker] *
                (rewardPerToken() - userRewardPerTokenPaid[_staker])) /
            1e18 +
            rewards[_staker];
    }

    function getReward() external updateReward(msg.sender) {
        uint reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            rewardToken.transfer(msg.sender, reward);
        }
    }

    function _min(uint x, uint y) private pure returns (uint) {
        return x <= y ? x : y;
    }
}
