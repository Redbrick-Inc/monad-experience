// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./BrickieNFT.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract WeeklyRewardContract is Context, AccessControlEnumerable {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    mapping(uint256 => bool) public _nonces;
    address payable public _treasureWallet;
    mapping(address => mapping(uint256 => bool)) _claimHist;

    address public _nftAddr;

    constructor(address nftAddr, address payable treasureWallet) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _nftAddr = nftAddr;
        _treasureWallet = treasureWallet;
    }

    event Claimed(
        address user,
        uint256 weekId,
        uint256[] values,
        uint256 nonce
    );

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
    modifier notDateClaimByAddr(uint256 weekId, address user) {
        require(!_claimHist[_msgSender()][weekId], "already claim this week");
        _;
    }

    function setTreasureWallet(
        address payable treasureWallet
    ) public onlyManager {
        _treasureWallet = treasureWallet;
    }

    // function mint(
    //     uint256 weekId,
    //     uint256 bricRoleAmount,
    //     uint256 brickieTokenId,
    //     uint256 badge,
    //     uint256 point,
    //     uint256 nonce,
    //     uint256 deadline,
    //     bytes calldata signature
    // )
    //     public
    //     payable
    //     onlyValidNonce(nonce)
    //     onlyValidTime(deadline)
    //     notDateClaimByAddr(weekId, _msgSender())
    // {
    //     bytes32 message = keccak256(
    //         abi.encodePacked(
    //             block.chainid,
    //             address(this),
    //             _msgSender(),
    //             weekId,
    //             bricRoleAmount,
    //             brickieTokenId,
    //             badge,
    //             point,
    //             msg.value,
    //             nonce,
    //             deadline
    //         )
    //     );
    //     bytes32 msgHash = ECDSA.toEthSignedMessageHash(message);
    //     require(
    //         hasRole(MANAGER_ROLE, ECDSA.recover(msgHash, signature)),
    //         "invalid signature"
    //     );
    //     _nonces[nonce] = true;
    //     _claimHist[_msgSender()][weekId] = true;
    //     BrickieNFT nft = BrickieNFT(_nftAddr);
    //     nft.mint(_msgSender(), brickieTokenId);
    //     _treasureWallet.transfer(msg.value);
    //     emit Claimed(
    //         _msgSender(),
    //         weekId,
    //         bricRoleAmount,
    //         brickieTokenId,
    //         badge,
    //         point,
    //         msg.value,
    //         nonce
    //     );
    // }

    function claim(
        uint256 weekId,
        uint256[] calldata values,
        // uint256 bricRoleAmount,
        // uint256 brickieTokenId,
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
        notDateClaimByAddr(weekId, _msgSender())
    {
        bytes32 message = keccak256(
            abi.encodePacked(
                block.chainid,
                address(this),
                _msgSender(),
                weekId,
                values,
                // bricRoleAmount,
                // brickieTokenId,
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
        _claimHist[_msgSender()][weekId] = true;
        BrickieNFT nft = BrickieNFT(_nftAddr);
        nft.mint(_msgSender(), values[1]);
        _treasureWallet.transfer(msg.value);
        emit Claimed(_msgSender(), weekId, values, nonce);
    }

    receive() external payable {}
}
