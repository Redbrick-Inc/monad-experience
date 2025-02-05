// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Context.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract GameItemTradeContract is Context, AccessControlEnumerable {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    mapping(uint256 => bool) public _nonces;
    address payable public _treasureWallet;

    constructor(address payable treasureWallet) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _treasureWallet = treasureWallet;
    }

    event Bought(
        address user,
        uint256 item,
        uint256 amount,
        uint256 point,
        uint256 price,
        uint256 nonce
    );
    modifier onlyManager() {
        require(hasRole(MANAGER_ROLE, _msgSender()), "Invalid sender");
        _;
    }
    modifier onlyValidNonce(uint256 nonce) {
        require(!_nonces[nonce], "invalid nonce");
        _;
    }
    modifier onlyValidTime(uint256 deadline) {
        require(block.timestamp < deadline, "invalid timestamp");
        _;
    }

    function setTreasureWallet(
        address payable treasureWallet
    ) public onlyManager {
        _treasureWallet = treasureWallet;
    }

    function buy(
        uint256 item,
        uint256 amount,
        uint256 point,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) public payable onlyValidNonce(nonce) onlyValidTime(deadline) {
        bytes32 message = keccak256(
            abi.encodePacked(
                block.chainid,
                address(this),
                _msgSender(),
                item,
                amount,
                point,
                msg.value,
                nonce,
                deadline
            )
        );
        bytes32 msgHash = ECDSA.toEthSignedMessageHash(message);
        require(
            hasRole(MANAGER_ROLE, ECDSA.recover(msgHash, signature)),
            "invalid signature"
        );

        _nonces[nonce] = true;
        _treasureWallet.transfer(msg.value);
        emit Bought(_msgSender(), item, amount, point, msg.value, nonce);
    }

    receive() external payable {}
}
