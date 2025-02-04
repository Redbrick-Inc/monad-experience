// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Context.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract DailyRewardContract is Context, AccessControlEnumerable {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    mapping(uint256 => bool) public _nonces;
    mapping(address => mapping(uint256 => bool)) _claimHist;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
    }

    event Claimed(address user, uint256 dateId, uint256 point, uint256 nonce);
    modifier onlyManager() {
        require(
            hasRole(MANAGER_ROLE, _msgSender()),
            "SpinContract: Invalid sender"
        );
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
    modifier notDateClaimByAddr(uint256 dateId, address user) {
        require(!_claimHist[_msgSender()][dateId], "already claim this date");
        _;
    }

    function claim(
        uint256 dateId,
        uint256 point,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    )
        public
        payable
        onlyValidNonce(nonce)
        onlyValidTime(deadline)
        notDateClaimByAddr(dateId, _msgSender())
    {
        bytes32 message = keccak256(
            abi.encodePacked(
                block.chainid,
                address(this),
                _msgSender(),
                dateId,
                point,
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
        _claimHist[_msgSender()][dateId] = true;
        emit Claimed(_msgSender(), dateId, point, nonce);
    }

    receive() external payable {}
}
