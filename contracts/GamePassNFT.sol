//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";

contract GamePassNFT is ERC721Burnable, AccessControlEnumerable {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    string public _baseURIPrefix;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(MANAGER_ROLE, _msgSender());
    }

    modifier onlyManager() {
        require(hasRole(MANAGER_ROLE, _msgSender()), "Invalid sender");
        _;
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(AccessControlEnumerable, ERC721)
        returns (bool)
    {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(AccessControlEnumerable).interfaceId ||
            super.supportsInterface(interfaceId);
    }

    /**
     * issue new nft
     * @param to receiver address
     * @param tokendId tokenId
     */
    function mint(address to, uint256 tokendId) public onlyManager {
        _safeMint(to, tokendId);
    }

    /**
     * update new baseURI
     * @param baseURIPrefix newBaseURI
     */
    function setBaseURI(string memory baseURIPrefix) public onlyManager {
        _baseURIPrefix = baseURIPrefix;
    }

    /**
     * override the baseURI which derived from ERC721
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIPrefix;
    }
}
