# Especificación de Contratos – Sonetyo

## 1. SonetyoNFT (Prueba de ideas musicales)

- **Tipo**: ERC-721 + `ERC721URIStorage` + `Ownable`.
- **Responsabilidad**: registrar ideas musicales como NFTs con hash + timestamp + creador.

### 1.1. Estado

- `uint256 _nextTokenId`
- `mapping(uint256 => SonetyoProof) proofs`
- `mapping(bytes32 => bool) hashExists`
- `mapping(address => uint256) creatorMintCount`
- `mapping(address => uint256) verifierCount`
- `mapping(uint256 => mapping(address => bool)) hasVerified`

### 1.2. Funciones principales

- `function mint(bytes32 audioHash, string memory uri) external returns (uint256)`
  - Reverts:
    - `"Hash invalido"` si `audioHash == 0`.
    - `"Este audio ya fue registrado"` si `hashExists[audioHash] == true`.
- `function verify(uint256 tokenId) external`
  - Reverts:
    - `"Token no existe"` si `_ownerOf(tokenId) == 0`.
    - `"No puedes verificar tu propia idea"` si `proofs[tokenId].creator == msg.sender`.
    - `"Ya verificaste esta idea"` si `hasVerified[tokenId][msg.sender] == true`.
- Consultas:
  - `getProof(uint256 tokenId)`
  - `getCreatorStats(address creator)`
  - `isHashRegistered(bytes32 audioHash)`
  - `totalSupply()`

## 2. CreatorToken (ERC-20 por artista)

- **Tipo**: ERC-20 + `Ownable`.
- **Responsabilidad**: representar apoyo/inversión en un artista concreto.

### 2.1. Estado

- `address public immutable artist;`

### 2.2. Constructor

```solidity
constructor(
    string memory name_,
    string memory symbol_,
    address artist_,
    uint256 initialSupply_
) ERC20(name_, symbol_) Ownable(artist_)
```

- Reverts:
  - `"Artist invalido"` si `artist_ == address(0)`.
- Efectos:
  - Asigna `artist = artist_`.
  - Si `initialSupply_ > 0`, mintea ese monto al artista.

### 2.3. Funciones

- `function mintToSupporter(address to, uint256 amount) external onlyOwner`
  - Solo el artista (owner) puede llamarla.
  - Reverts:
    - `"Destino invalido"` si `to == 0`.
    - `"Cantidad invalida"` si `amount == 0`.

## 3. ProjectVault (NFT de proyecto)

- **Tipo**: ERC-721 + `ERC721URIStorage` + `Ownable`.
- **Responsabilidad**: agrupar varias ideas (SonetyoNFT) en un proyecto.

### 3.1. Estado

- `uint256 _nextVaultId`
- `mapping(uint256 => Vault) _vaults`
- `SonetyoNFT public immutable sonetyoProof`

Donde:

```solidity
struct Vault {
    uint256[] ideaTokenIds;
    address creator;
}
```

### 3.2. Constructor

```solidity
constructor(address sonetyoAddress) ERC721("Sonetyo Project Vault", "SONVLT") Ownable(msg.sender)
```

- Reverts:
  - `"Direccion Sonetyo invalida"` si `sonetyoAddress == 0`.

### 3.3. Funciones

- `function createVault(uint256[] calldata ideaTokenIds, string calldata metadataURI) external returns (uint256)`
  - Reverts:
    - `"Sin ideas"` si `ideaTokenIds.length == 0`.
    - `"Idea inexistente"` si `sonetyoProof.ownerOf(tokenId) == 0`.
    - `"No eres creador ni dueno de la idea"` si el msg.sender no es `proof.creator` ni `ownerOf(tokenId)`.
  - Efectos:
    - Crea nueva entrada en `_vaults`.
    - Mintea NFT vault al msg.sender.

- Consultas:
  - `getVault(uint256 vaultId)` → struct completo.
  - `getVaultIdeas(uint256 vaultId)` → lista de `tokenId`.

