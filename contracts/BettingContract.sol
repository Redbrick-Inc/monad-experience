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

    constructor(address payable treasureWallet) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _treasureWallet = treasureWallet;
    }

    event BetEvent(
        address user,
        uint256 gameId,
        uint256 voteType,
        uint256 stars,
        uint256 fee,
        uint256 nonce
    );

    function setTreasureWallet(
        address payable treasureWallet
    ) public onlyManager {
        _treasureWallet = treasureWallet;
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
        _doBet(gameId, voteType, stars, msg.value, nonce);
    }

    function _doBet(
        uint256 gameId,
        uint256 voteType,
        uint256 stars,
        uint256 fee,
        uint256 nonce
    ) private {
        _bets[gameId][_msgSender()] = BettingData(true, voteType, stars);
        emit BetEvent(_msgSender(), gameId, voteType, stars, fee, nonce);
    }

    receive() external payable {}
}
