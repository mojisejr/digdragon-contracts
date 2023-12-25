//SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";




contract DracaToken is ERC20, ERC20Burnable, AccessControl {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant EVENT_MANAGER = keccak256("EVENT_MANAGER");
    bytes32 public constant RECEIVER = keccak256("RECEIVER");

    //==========
    // Event State
    //==========
    struct Event {
        uint256 id;
        uint256 start;
        uint256 end;
        bool active;
    }
    uint256 totalEvent = 0;
    uint256 eventId = 0;
    mapping(uint256 => Event) events;
    mapping(uint256 => mapping(address => uint256)) walletToClaimable;
    mapping(uint256 => mapping(address => bool)) walletToClaimed;
    mapping(address => bool) blacklist;

    //==========
    // Constructor
    //==========
    constructor() ERC20("DracaToken", "DKT") {
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(BURNER_ROLE, msg.sender);
        _grantRole(EVENT_MANAGER, msg.sender);
        _grantRole(RECEIVER, msg.sender);
    }

    //==========
    // ERRORS
    //==========



    //==========
    // Modifier
    //==========
    modifier whenClaimable(uint256 _eventId) {
        require(events[_eventId].start < block.timestamp, 'this event is not started yet');
        require(events[_eventId].end > block.timestamp, 'this event is ended');
        require(walletToClaimable[_eventId][msg.sender] > 0, 'you have already claimed');
        require(!walletToClaimed[_eventId][msg.sender], 'your wallet is not active');
        _;
    }


    //==========
    // OnlyRole
    //==========
    event Minted(address indexed to, uint256 amount);
    function mint(address _to, uint256 _amount) external onlyRole(MINTER_ROLE) {
        require(_amount > 0, 'mint: invalid minting amount');
        _mint(_to, _amount);

        emit Minted(_to, _amount);
    }

    event Burned(address indexed owner, uint256 burned);
    function burn(address _owner, uint256 _amount) external onlyRole(BURNER_ROLE) {
        require(_amount > 0, 'burn: invalid burning amount');
        _burn(_owner, _amount);

        emit Burned(_owner, _amount);
    }

    event AddEvent(uint256 indexed eventId, uint256 start, uint256 end);
    function addEvent(address[] memory _wallets, uint256[] memory _claimable, uint256 _start, uint256 _end) external onlyRole(EVENT_MANAGER) {
        uint256 currentEventId = getCurrentEventId(); 

        events[currentEventId].id = currentEventId;
        events[currentEventId].active = true;
        events[currentEventId].start = _start;
        events[currentEventId].end = _end;

        for(uint256 i = 0 ; i < _wallets.length; i++) {
            walletToClaimable[currentEventId][_wallets[i]] = _claimable[i];
        }

        emit AddEvent(currentEventId, _start, _end);

        _increaseCurrentEventId();
    }

    function setActive(uint256 _eventId, bool _value) external onlyRole(EVENT_MANAGER) {
        events[_eventId].active = _value;
    }

    function setStart(uint256 _eventId, uint256 _value) external onlyRole(EVENT_MANAGER) {
        events[_eventId].start = _value;
    }

    function setEnd(uint256 _eventId, uint256 _value) external onlyRole(EVENT_MANAGER) {
        events[_eventId].end = _value;
    }

    function setClaimed(uint256 _eventId, address[] memory _users, bool[] memory _values) external onlyRole(EVENT_MANAGER) {
        require(_users.length == _values.length, 'setClaimed: invalid input data');
        for(uint256 i = 0; i < _users.length; i++) {
            walletToClaimed[_eventId][_users[i]] = _values[i];
        }
    }

    function setAmount(uint256 _eventId, address[] memory _users, uint256[] memory _amounts) external onlyRole(EVENT_MANAGER) {
        require(_users.length == _amounts.length, 'setAmount: invalid input data');
        for(uint256 i = 0; i < _users.length; i++) {
            walletToClaimable[_eventId][_users[i]] = _amounts[i];
        }
    }

    function addBacklist(address _user) external onlyRole(EVENT_MANAGER) {
        blacklist[_user] = true;
    }


    function addReceiver(address _receiver) external onlyRole(EVENT_MANAGER) {
        _grantRole(RECEIVER, _receiver);
    }


    //==========
    // User Callable
    //==========
    function claim(uint256 _eventId) public whenClaimable(_eventId) {
        _claim(_eventId);
    }

    function getEvent(uint256 _eventId) public view returns(Event memory) {
        return events[_eventId];
    }

    function getClaimable(uint256 _eventId, address _user) public view returns(uint256) {
        return walletToClaimable[_eventId][_user];
    }

    function getAllEvents() public view returns(Event[] memory) {
        Event[] memory allEvents = new Event[](totalEvent);

        for(uint256 i = 0; i < totalEvent; i ++) {
           allEvents[i] = events[i + 1];
        }

        return allEvents;
    }

    function getAllEventsAndClaimableOf(address _owner) public view returns(Event[] memory, uint256[] memory, bool[] memory) {
        Event[] memory allEvents = new Event[](totalEvent);
        uint256[] memory claimable = new uint256[](totalEvent);
        bool[] memory claimed = new bool[](totalEvent);

        for(uint256 i = 0; i < totalEvent; i ++) {
            allEvents[i] = events[i + 1];
            claimable[i] = walletToClaimable[i + 1][_owner];
            claimed[i] = walletToClaimed[i + 1][_owner];
        }


        return (allEvents, claimable, claimed);
    }

    function isRedeemable(address _receiver) external view returns(bool) {
        return hasRole(RECEIVER, _receiver);
    }

    function getCurrentEventId() public view returns(uint256) {
        return eventId + 1;
    }


    //==========
    // Internal 
    //==========
    function _increaseCurrentEventId() internal {
        ++eventId;
        ++totalEvent;
    }

    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override(ERC20) {
        if(from != address(0) && !hasRole(EVENT_MANAGER, from)) {
            require(hasRole(RECEIVER, to), 'cannot transfer token to other one');
        }
        require(!blacklist[to] && !blacklist[from], 'you are back listed pls contract dev');
    }

    function _claim(uint256 _eventId) internal {
       uint256 claimable = walletToClaimable[_eventId][msg.sender];
       
       walletToClaimable[_eventId][msg.sender] = 0;
       walletToClaimed[_eventId][msg.sender] = true;

       _mint(msg.sender, claimable);
    }
}