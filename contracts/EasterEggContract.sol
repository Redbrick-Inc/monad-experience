// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./BrikieNFT.sol";
import "./MolandakNFT.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract EasterEggContract is Context, AccessControlEnumerable {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    mapping(uint256 => bool) public _nonces;
    address payable public _treasureWallet;
    mapping(uint256 => bool) _claimHist;

    address public _molandakNFTAddr;

    constructor(address molandakNFTAddr, address payable treasureWallet) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _molandakNFTAddr = molandakNFTAddr;
        _treasureWallet = treasureWallet;
    }

    event ClaimedEgg(
        address user,
        uint256 eggId,
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
    modifier notEggClaimById(uint256 weekId) {
        require(!_claimHist[weekId], "already claim this egg");
        _;
    }

    function setTreasureWallet(
        address payable treasureWallet
    ) public onlyManager {
        _treasureWallet = treasureWallet;
    }

    function claimEgg(
        uint256 eggId,
        uint256[] calldata values, //stars  - molandakTokenId
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    )
        public
        payable
        onlyValidNonce(nonce)
        onlyValidTime(deadline)
        notEggClaimById(eggId)
    {
        bytes32 message = keccak256(
            abi.encodePacked(
                block.chainid,
                address(this),
                _msgSender(),
                eggId,
                values,
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
        _claimHist[eggId] = true;
        if (values[1] > 0) {
            MolandakNFT nft = MolandakNFT(_molandakNFTAddr);
            nft.mint(_msgSender(), values[1]);
        }
        _treasureWallet.transfer(msg.value);
        emit ClaimedEgg(_msgSender(), eggId, values, nonce);
    }

    receive() external payable {}
}
