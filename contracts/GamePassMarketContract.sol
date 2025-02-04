// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./GamePassNFT.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";

contract GamePassMarketContract is Context, AccessControlEnumerable {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    mapping(uint256 => bool) public _nonces;

    address public _nftAddr;

    constructor(address nftAddr) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _nftAddr = nftAddr;
    }

    event Minted(address user, uint256 tokenId, uint256 nonce);
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
    modifier isMintable(address user) {
        IERC721 nft = IERC721(_nftAddr);
        require(nft.balanceOf(user) == 0, "already has game pass");
        _;
    }

    function mint(
        uint256 tokenId,
        uint256 nonce,
        uint256 deadline,
        bytes calldata signature
    )
        public
        payable
        onlyValidNonce(nonce)
        onlyValidTime(deadline)
        isMintable(_msgSender())
    {
        bytes32 message = keccak256(
            abi.encodePacked(
                block.chainid,
                address(this),
                _msgSender(),
                tokenId,
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

        GamePassNFT nft = GamePassNFT(_nftAddr);
        nft.mint(_msgSender(), tokenId);
        emit Minted(_msgSender(), tokenId, nonce);
    }

    receive() external payable {}
}
