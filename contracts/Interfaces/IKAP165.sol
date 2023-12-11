//SPDX-License-Identifier:MIT
pragma solidity ^0.8.18;

interface IKAP165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}
