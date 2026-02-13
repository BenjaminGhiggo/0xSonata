// Configuración del contrato SonataNFT — zkSYS PoB Devnet (57042)
// Dirección leída desde las variables de entorno de Vite (frontend/.env)
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

// ABI mínima de SonataNFT (solo funciones que usamos)
export const CONTRACT_ABI = [
  "function mint(bytes32 audioHash, string uri) external returns (uint256)",
  "function verify(uint256 tokenId) external",
  "function getProof(uint256 tokenId) external view returns (bytes32 audioHash,uint256 timestamp,address creator,uint256 verificationCount)",
  "function isHashRegistered(bytes32 audioHash) external view returns (bool)",
  "function totalSupply() external view returns (uint256)",
  "event SonataMinted(uint256 indexed tokenId, address indexed creator, bytes32 audioHash, uint256 timestamp)",
  "event SonataVerified(uint256 indexed tokenId, address indexed verifier, uint256 newVerificationCount)"
];

// Red zkSYS PoB Devnet (Proof-of-Builders)
export const DEVNET_CONFIG = {
  chainId: "0xDED2", // 57042 en hex
  chainName: "zkSYS PoB Devnet",
  rpcUrls: ["https://rpc-pob.dev11.top"],
  nativeCurrency: {
    name: "TSYS",
    symbol: "TSYS",
    decimals: 18
  },
  blockExplorerUrls: ["https://explorer-pob.dev11.top"]
};

export const EXPLORER_BASE_URL = "https://explorer-pob.dev11.top";
