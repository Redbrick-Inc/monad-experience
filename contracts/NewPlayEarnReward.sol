// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract NewPlayEarnReward is Context, AccessControlEnumerable {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    mapping(uint256 => bool) public _nonces;
    address payable public _treasureWallet;
    mapping(address => mapping(uint256 => bool)) _claimHist;

    constructor(address payable treasureWallet) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _treasureWallet = treasureWallet;
    }

    event Claimed(
        address user,
        uint256 weekId,
        uint256[] values,
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
    modifier notAlreadyClaimByAddr(uint256 claimId, address user) {
        require(!_claimHist[_msgSender()][claimId], "already claim");
        _;
    }

    function setTreasureWallet(
        address payable treasureWallet
    ) public onlyManager {
        _treasureWallet = treasureWallet;
    }

    function claim(
        uint256 claimId,
        uint256[] calldata values,
        // uint256 bricRoleAmount,
        // uint256 badge,
        // uint256 point,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    )
        public
        payable
        onlyValidNonce(nonce)
        onlyValidTime(deadline)
        notAlreadyClaimByAddr(claimId, _msgSender())
    {
        bytes32 message = keccak256(
            abi.encodePacked(
                block.chainid,
                address(this),
                _msgSender(),
                claimId,
                values,
                // bricRoleAmount,
                // badge,
                // point,
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
        _claimHist[_msgSender()][claimId] = true;
        _treasureWallet.transfer(msg.value);
        emit Claimed(_msgSender(), claimId, values, nonce);
    }

    receive() external payable {}
}
