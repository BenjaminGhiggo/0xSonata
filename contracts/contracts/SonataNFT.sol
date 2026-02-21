// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title SonataNFT — Creative Process Chain
 * @notice Registra ideas musicales Y el proceso creativo completo on-chain.
 *         Diseñado para artistas que usan IA musical (Suno, Udio, etc.)
 *         y necesitan documentar "control creativo suficiente" para copyright.
 *
 * Capa 1: Creative Process Chain (mint + addStep)
 * Capa 2: Verificación con Stake (deposit + verify)
 * Capa 3: Reputación y Tiers (getTier, getVerificationWeight)
 */
contract SonataNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {

    struct CreativeStep {
        bytes32 contentHash;
        uint8 stepType;   // 0=prompt, 1=ai_variation, 2=selection, 3=daw_edit, 4=master_final
        uint256 timestamp;
        string metadata;
    }

    struct SonataProof {
        bytes32 audioHash;
        uint256 timestamp;
        address creator;
        uint256 verificationCount;
        uint256 stepCount;
    }

    uint256 private _nextTokenId;
    uint256 public constant MIN_STAKE = 0.001 ether;

    mapping(uint256 => SonataProof) public proofs;
    mapping(uint256 => CreativeStep[]) private _creativeSteps;
    mapping(bytes32 => bool) public hashExists;
    mapping(address => uint256) public creatorMintCount;
    mapping(address => uint256) public verifierCount;
    mapping(uint256 => mapping(address => bool)) public hasVerified;

    mapping(address => uint256) public stakeBalance;
    mapping(address => uint256) public verificationsReceived;
    mapping(address => uint256) public firstActivityTimestamp;

    event SonataMinted(uint256 indexed tokenId, address indexed creator, bytes32 audioHash, uint256 timestamp);
    event SonataVerified(uint256 indexed tokenId, address indexed verifier, uint256 newVerificationCount);
    event StepAdded(uint256 indexed tokenId, uint8 stepType, bytes32 contentHash);
    event StakeDeposited(address indexed user, uint256 amount);
    event StakeWithdrawn(address indexed user, uint256 amount);

    constructor() ERC721("Sonata Proof", "SONATA") Ownable(msg.sender) {}

    // =========================================================================
    // CAPA 1 — Creative Process Chain
    // =========================================================================

    function mint(bytes32 audioHash, string memory uri) external returns (uint256) {
        require(audioHash != bytes32(0), "Hash invalido");
        require(!hashExists[audioHash], "Este audio ya fue registrado");

        uint256 tokenId = _nextTokenId++;

        proofs[tokenId] = SonataProof({
            audioHash: audioHash,
            timestamp: block.timestamp,
            creator: msg.sender,
            verificationCount: 0,
            stepCount: 0
        });

        hashExists[audioHash] = true;
        creatorMintCount[msg.sender]++;

        if (firstActivityTimestamp[msg.sender] == 0) {
            firstActivityTimestamp[msg.sender] = block.timestamp;
        }

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        emit SonataMinted(tokenId, msg.sender, audioHash, block.timestamp);
        return tokenId;
    }

    function addStep(
        uint256 tokenId,
        bytes32 contentHash,
        uint8 stepType,
        string calldata metadata
    ) external {
        require(_ownerOf(tokenId) != address(0), "Token no existe");
        require(proofs[tokenId].creator == msg.sender, "Solo el creador puede agregar pasos");
        require(stepType <= 4, "Tipo de paso invalido");
        require(contentHash != bytes32(0), "Hash invalido");

        _creativeSteps[tokenId].push(CreativeStep({
            contentHash: contentHash,
            stepType: stepType,
            timestamp: block.timestamp,
            metadata: metadata
        }));

        proofs[tokenId].stepCount++;
        emit StepAdded(tokenId, stepType, contentHash);
    }

    function getCreativeSteps(uint256 tokenId) external view returns (CreativeStep[] memory) {
        require(_ownerOf(tokenId) != address(0), "Token no existe");
        return _creativeSteps[tokenId];
    }

    // =========================================================================
    // CAPA 2 — Verificación con Stake
    // =========================================================================

    function deposit() external payable {
        require(msg.value > 0, "Debe enviar fondos");
        stakeBalance[msg.sender] += msg.value;

        if (firstActivityTimestamp[msg.sender] == 0) {
            firstActivityTimestamp[msg.sender] = block.timestamp;
        }

        emit StakeDeposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        require(stakeBalance[msg.sender] >= amount, "Fondos insuficientes");
        stakeBalance[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit StakeWithdrawn(msg.sender, amount);
    }

    function verify(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Token no existe");
        require(proofs[tokenId].creator != msg.sender, "No puedes verificar tu propia idea");
        require(!hasVerified[tokenId][msg.sender], "Ya verificaste esta idea");
        require(stakeBalance[msg.sender] >= MIN_STAKE, "Stake insuficiente para verificar");

        hasVerified[tokenId][msg.sender] = true;
        proofs[tokenId].verificationCount++;
        verifierCount[msg.sender]++;
        verificationsReceived[proofs[tokenId].creator]++;

        emit SonataVerified(tokenId, msg.sender, proofs[tokenId].verificationCount);
    }

    // =========================================================================
    // CAPA 3 — Reputación y Tiers
    // =========================================================================

    /// @return 0=Emergente, 1=Bronce, 2=Plata, 3=Oro
    function getTier(address creator) public view returns (uint8) {
        if (firstActivityTimestamp[creator] == 0) return 0;

        uint256 mints = creatorMintCount[creator];
        uint256 verifReceived = verificationsReceived[creator];
        uint256 verifGiven = verifierCount[creator];
        uint256 accountAge = block.timestamp - firstActivityTimestamp[creator];

        if (mints >= 50 && verifReceived >= 25 && verifGiven >= 10 && accountAge >= 365 days) {
            return 3; // Oro
        }
        if (mints >= 21 && verifReceived >= 10 && accountAge >= 180 days) {
            return 2; // Plata
        }
        if (mints >= 6 && verifReceived >= 3) {
            return 1; // Bronce
        }
        return 0; // Emergente
    }

    function getVerificationWeight(address verifier) external view returns (uint256) {
        uint8 tier = getTier(verifier);
        if (tier == 3) return 3;
        if (tier == 2) return 2;
        return 1;
    }

    // =========================================================================
    // Queries
    // =========================================================================

    function getProof(uint256 tokenId) external view returns (SonataProof memory) {
        require(_ownerOf(tokenId) != address(0), "Token no existe");
        return proofs[tokenId];
    }

    function getCreatorStats(address creator) external view returns (
        uint256 totalMints,
        uint256 totalVerificationsGiven,
        uint256 totalVerificationsReceived,
        uint8 tier
    ) {
        return (
            creatorMintCount[creator],
            verifierCount[creator],
            verificationsReceived[creator],
            getTier(creator)
        );
    }

    function isHashRegistered(bytes32 audioHash) external view returns (bool) {
        return hashExists[audioHash];
    }

    function totalSupply() external view returns (uint256) {
        return _nextTokenId;
    }

    // =========================================================================
    // Overrides
    // =========================================================================

    function tokenURI(uint256 tokenId)
        public view override(ERC721, ERC721URIStorage) returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721, ERC721URIStorage) returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
