// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProjectVault — Capa 4
 * @notice Agrupa ideas musicales (SonataNFT) en proyectos con revenue share
 *         entre colaboradores. Los splits se definen al crear el vault y los
 *         pagos se distribuyen automaticamente via smart contract.
 */
interface ISonataNFT {
    struct SonataProof {
        bytes32 audioHash;
        uint256 timestamp;
        address creator;
        uint256 verificationCount;
        uint256 stepCount;
    }
    function getProof(uint256 tokenId) external view returns (SonataProof memory);
    function ownerOf(uint256 tokenId) external view returns (address);
}

contract ProjectVault is Ownable, ReentrancyGuard {

    struct Vault {
        uint256 id;
        address creator;
        uint256[] ideaTokenIds;
        address[] collaborators;
        uint256[] splits;        // basis points: 10000 = 100%
        string metadataURI;
        uint256 totalReceived;
        uint256 createdAt;
    }

    ISonataNFT public sonataNFT;
    uint256 private _nextVaultId;

    mapping(uint256 => Vault) public vaults;
    mapping(address => uint256[]) public creatorVaultIds;

    event VaultCreated(uint256 indexed vaultId, address indexed creator, uint256[] ideaTokenIds);
    event PaymentReceived(uint256 indexed vaultId, address indexed from, uint256 amount);
    event PaymentDistributed(uint256 indexed vaultId, uint256 amount);

    constructor(address _sonataNFT) Ownable(msg.sender) {
        sonataNFT = ISonataNFT(_sonataNFT);
    }

    function createVault(
        uint256[] calldata ideaTokenIds,
        address[] calldata collaborators,
        uint256[] calldata splits,
        string calldata metadataURI
    ) external returns (uint256) {
        require(ideaTokenIds.length > 0, "Debe incluir al menos una idea");
        require(collaborators.length == splits.length, "Colaboradores y splits deben coincidir");

        uint256 totalSplits;
        for (uint256 i = 0; i < splits.length; i++) {
            totalSplits += splits[i];
        }
        require(totalSplits == 10000, "Los splits deben sumar 100%");

        for (uint256 i = 0; i < ideaTokenIds.length; i++) {
            require(
                sonataNFT.ownerOf(ideaTokenIds[i]) == msg.sender,
                "Debes ser dueno de todas las ideas"
            );
        }

        uint256 vaultId = _nextVaultId++;

        Vault storage v = vaults[vaultId];
        v.id = vaultId;
        v.creator = msg.sender;
        v.ideaTokenIds = ideaTokenIds;
        v.collaborators = collaborators;
        v.splits = splits;
        v.metadataURI = metadataURI;
        v.totalReceived = 0;
        v.createdAt = block.timestamp;

        creatorVaultIds[msg.sender].push(vaultId);

        emit VaultCreated(vaultId, msg.sender, ideaTokenIds);
        return vaultId;
    }

    function fundVault(uint256 vaultId) external payable nonReentrant {
        Vault storage vault = vaults[vaultId];
        require(vault.creator != address(0), "Vault no existe");
        require(msg.value > 0, "Debe enviar fondos");

        vault.totalReceived += msg.value;

        for (uint256 i = 0; i < vault.collaborators.length; i++) {
            uint256 share = (msg.value * vault.splits[i]) / 10000;
            payable(vault.collaborators[i]).transfer(share);
        }

        emit PaymentReceived(vaultId, msg.sender, msg.value);
        emit PaymentDistributed(vaultId, msg.value);
    }

    function getVault(uint256 vaultId) external view returns (
        uint256 id,
        address creator,
        uint256[] memory ideaTokenIds,
        address[] memory collaborators,
        uint256[] memory splits,
        string memory metadataURI,
        uint256 totalReceived,
        uint256 createdAt
    ) {
        Vault storage v = vaults[vaultId];
        require(v.creator != address(0), "Vault no existe");
        return (v.id, v.creator, v.ideaTokenIds, v.collaborators, v.splits, v.metadataURI, v.totalReceived, v.createdAt);
    }

    function getCreatorVaults(address creator) external view returns (uint256[] memory) {
        return creatorVaultIds[creator];
    }

    function totalVaults() external view returns (uint256) {
        return _nextVaultId;
    }
}
