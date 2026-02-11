// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./SonetyoNFT.sol";

/**
 * @title ProjectVault
 * @dev NFT que agrupa varias ideas (Sonetyo Proofs) en un solo proyecto.
 *
 * Un vault representa un proyecto musical compuesto por varias ideas registradas:
 * - Referencia a tokenIds de SonetyoNFT.
 * - Metadata propia del proyecto (IPFS).
 */
contract ProjectVault is ERC721, ERC721URIStorage, Ownable {
    struct Vault {
        uint256[] ideaTokenIds;
        address creator;
    }

    uint256 private _nextVaultId;
    mapping(uint256 => Vault) private _vaults;

    SonetyoNFT public immutable sonetyoProof;

    event VaultCreated(
        uint256 indexed vaultId,
        address indexed creator,
        uint256[] ideaTokenIds
    );

    constructor(address sonetyoAddress) ERC721("Sonetyo Project Vault", "SONVLT") Ownable(msg.sender) {
        require(sonetyoAddress != address(0), "Direccion Sonetyo invalida");
        sonetyoProof = SonetyoNFT(sonetyoAddress);
    }

    /**
     * @dev Crea un nuevo vault agrupando varias ideas (tokenIds de SonetyoNFT).
     * Requiere que el llamador sea creador de todas las ideas o propietario actual del NFT.
     */
    function createVault(
        uint256[] calldata ideaTokenIds,
        string calldata metadataURI
    ) external returns (uint256) {
        require(ideaTokenIds.length > 0, "Sin ideas");

        // Validar propiedad/autoría básica
        for (uint256 i = 0; i < ideaTokenIds.length; i++) {
            uint256 tokenId = ideaTokenIds[i];

            // Debe existir
            require(sonetyoProof.ownerOf(tokenId) != address(0), "Idea inexistente");

            // Debe ser creador original o propietario actual
            SonetyoNFT.SonetyoProof memory proof = sonetyoProof.proofs(tokenId);
            address owner = sonetyoProof.ownerOf(tokenId);
            require(
                proof.creator == msg.sender || owner == msg.sender,
                "No eres creador ni dueno de la idea"
            );
        }

        uint256 vaultId = _nextVaultId++;

        _vaults[vaultId] = Vault({
            ideaTokenIds: ideaTokenIds,
            creator: msg.sender
        });

        _safeMint(msg.sender, vaultId);
        _setTokenURI(vaultId, metadataURI);

        emit VaultCreated(vaultId, msg.sender, ideaTokenIds);

        return vaultId;
    }

    function getVault(uint256 vaultId) external view returns (Vault memory) {
        require(_ownerOf(vaultId) != address(0), "Vault no existe");
        return _vaults[vaultId];
    }

    function getVaultIdeas(uint256 vaultId) external view returns (uint256[] memory) {
        require(_ownerOf(vaultId) != address(0), "Vault no existe");
        return _vaults[vaultId].ideaTokenIds;
    }

    // ============ Overrides requeridos ============

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

