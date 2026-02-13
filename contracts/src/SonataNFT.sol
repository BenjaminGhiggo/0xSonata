// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title SonataNFT
 * @dev NFT para registro de ideas musicales con prueba de existencia on-chain
 * @notice "La idea musical existe desde el momento en que la creas"
 *
 * Capa 1: Prueba de Creatividad
 * - Registro on-chain de ideas musicales (beats, melodías, loops, tarareos)
 * - Timestamp verificable + hash SHA-256 del audio
 * - Verificaciones sociales de otros artistas
 *
 * Visión Futura (Fase 2/3):
 * - Capa 2: Reputación del artista (stats agregadas)
 * - Capa 3: Tokenización e inversión en creatividad (Creator Pool Tokens, Project Vaults)
 */
contract SonataNFT is ERC721, ERC721URIStorage, Ownable {

    // ============ Estructuras ============

    struct SonataProof {
        bytes32 audioHash;      // Hash SHA-256 del audio
        uint256 timestamp;      // Momento del registro
        address creator;        // Creador original
        uint256 verificationCount; // Número de verificaciones
    }

    // ============ Estado ============

    uint256 private _nextTokenId;

    // tokenId => SonataProof
    mapping(uint256 => SonataProof) public proofs;

    // audioHash => existe (para evitar duplicados)
    mapping(bytes32 => bool) public hashExists;

    // address => total de ideas registradas
    mapping(address => uint256) public creatorMintCount;

    // address => total de verificaciones dadas
    mapping(address => uint256) public verifierCount;

    // tokenId => verifier => hasVerified
    mapping(uint256 => mapping(address => bool)) public hasVerified;

    // ============ Eventos ============

    event SonataMinted(
        uint256 indexed tokenId,
        address indexed creator,
        bytes32 audioHash,
        uint256 timestamp
    );

    event SonataVerified(
        uint256 indexed tokenId,
        address indexed verifier,
        uint256 newVerificationCount
    );

    // ============ Constructor ============

    constructor() ERC721("Sonata Proof", "SONATA") Ownable(msg.sender) {}

    // ============ Funciones Principales ============

    function mint(bytes32 audioHash, string memory uri) external returns (uint256) {
        require(audioHash != bytes32(0), "Hash invalido");
        require(!hashExists[audioHash], "Este audio ya fue registrado");

        uint256 tokenId = _nextTokenId++;

        proofs[tokenId] = SonataProof({
            audioHash: audioHash,
            timestamp: block.timestamp,
            creator: msg.sender,
            verificationCount: 0
        });

        hashExists[audioHash] = true;
        creatorMintCount[msg.sender]++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        emit SonataMinted(tokenId, msg.sender, audioHash, block.timestamp);

        return tokenId;
    }

    function verify(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Token no existe");
        require(proofs[tokenId].creator != msg.sender, "No puedes verificar tu propia idea");
        require(!hasVerified[tokenId][msg.sender], "Ya verificaste esta idea");

        hasVerified[tokenId][msg.sender] = true;

        proofs[tokenId].verificationCount++;
        verifierCount[msg.sender]++;

        emit SonataVerified(tokenId, msg.sender, proofs[tokenId].verificationCount);
    }

    // ============ Funciones de Consulta ============

    function getProof(uint256 tokenId) external view returns (SonataProof memory) {
        require(_ownerOf(tokenId) != address(0), "Token no existe");
        return proofs[tokenId];
    }

    function getCreatorStats(address creator) external view returns (
        uint256 totalMints,
        uint256 totalVerificationsGiven
    ) {
        return (creatorMintCount[creator], verifierCount[creator]);
    }

    function isHashRegistered(bytes32 audioHash) external view returns (bool) {
        return hashExists[audioHash];
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
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

