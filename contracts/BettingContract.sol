// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Context.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract BettingContract is Context, AccessControlEnumerable {
    struct BettingData {
        bool isJoined;
        uint256 voteType;
        uint256 stars;
    }
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    mapping(uint256 => bool) public _nonces;
    mapping(uint256 => mapping(address => BettingData)) public _bets;
    address payable public _treasureWallet;
    uint256 public _fee;

    constructor(address payable treasureWallet, uint256 fee) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _treasureWallet = treasureWallet;
        _fee = fee;
    }

    event BetEvent(
        address user,
        uint256 gameId,
        uint256 voteType,
        uint256 stars,
        uint256 nonce
    );

    function setTreasureWallet(
        address payable treasureWallet
    ) public onlyManager {
        _treasureWallet = treasureWallet;
    }

    function setFee(uint256 fee) public onlyManager {
        _fee = fee;
    }

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
    modifier isNotJoined(uint256 gameId, address user) {
        require(!_bets[gameId][_msgSender()].isJoined, "already joined");
        _;
    }

    function bet(
        uint256 gameId,
        uint256 voteType,
        uint256 stars,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    )
        public
        payable
        onlyValidNonce(nonce)
        onlyValidTime(deadline)
        isNotJoined(gameId, _msgSender())
    {
        bytes32 message = keccak256(
            abi.encodePacked(
                block.chainid,
                address(this),
                _msgSender(),
                gameId,
                voteType,
                stars,
                nonce,
                deadline
            )
        );
        bytes32 msgHash = ECDSA.toEthSignedMessageHash(message);
        require(
            hasRole(MANAGER_ROLE, ECDSA.recover(msgHash, signature)),
            "invalid signature"
        );
        require(msg.value == _fee, "not enough fee");
        _nonces[nonce] = true;
        _treasureWallet.transfer(_fee);
        _doBet(gameId, voteType, stars, nonce);
    }

    function _doBet(
        uint256 gameId,
        uint256 voteType,
        uint256 stars,
        uint256 nonce
    ) private {
        _bets[gameId][_msgSender()] = BettingData(true, voteType, stars);
        emit BetEvent(_msgSender(), gameId, voteType, stars, nonce);
    }

    receive() external payable {}
}
