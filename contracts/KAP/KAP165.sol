//SPDX-License-Identifier:MIT
pragma solidity ^0.8.18;

import "../Interfaces/IKAP165.sol";

abstract contract KAP165 is IKAP165 {
    function supportsInterface(bytes4 interfaceId) public view virtual override returns (bool) {
        return interfaceId == type(IKAP165).interfaceId;
    }
}
