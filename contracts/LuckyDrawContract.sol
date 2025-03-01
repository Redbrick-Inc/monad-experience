// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Context.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract LuckyDrawContract is Context, AccessControlEnumerable {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    address payable public _treasureWallet;
    uint256 public _totalLuckyDraw;
    uint256 public _luckyDrawLimitPerAddr;
    mapping(uint256 => mapping(address => uint)) public _gameLuckyDrawPerUser;
    mapping(uint256 => bool) public _nonces;
    mapping(uint256 => uint256) public _gameLuckyDraw;

    constructor(uint256 luckyDrawLimitPerUser, address payable treasureWallet) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _treasureWallet = treasureWallet;
        _luckyDrawLimitPerAddr = luckyDrawLimitPerUser;
    }

    event LuckyDraw(
        uint256 gameId,
        address user,
        uint256 stars,
        uint256 price,
        uint256 nonce
    );
    modifier onlyManager() {
        require(
            hasRole(MANAGER_ROLE, _msgSender()),
            "LuckyDrawContract: Invalid sender"
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

    function setTreasureWallet(
        address payable treasureWallet
    ) public onlyManager {
        _treasureWallet = treasureWallet;
    }

    function setLuckyDrawLimitPerUser(
        uint256 luckyDrawLimitPerUser
    ) public onlyManager {
        _luckyDrawLimitPerAddr = luckyDrawLimitPerUser;
    }

    function buyLuckyDraw(
        uint256 gameId,
        uint256 stars,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    ) public payable onlyValidNonce(nonce) onlyValidTime(deadline) {
        bytes32 message = keccak256(
            abi.encodePacked(
                block.chainid,
                address(this),
                _msgSender(),
                gameId,
                stars,
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
        require(
            _gameLuckyDrawPerUser[gameId][_msgSender()] <
                _luckyDrawLimitPerAddr,
            "limit per game per user"
        );

        _nonces[nonce] = true;
        _gameLuckyDraw[gameId] += 1;
        _gameLuckyDrawPerUser[gameId][_msgSender()] += 1;
        _totalLuckyDraw += 1;
        _treasureWallet.transfer(msg.value);
        emit LuckyDraw(gameId, _msgSender(), stars, msg.value, nonce);
    }

    receive() external payable {}
}
