// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CreatorToken
 * @dev Token ERC-20 simple para representar apoyo a un artista específico.
 *
 * Este contrato está pensado como "Creator Pool Token" por artista:
 * - Un despliegue por artista.
 * - El artista recibe el supply inicial.
 * - Opcionalmente puede mintear más tokens si el modelo de negocio lo permite.
 */
contract CreatorToken is ERC20, Ownable {
    address public immutable artist;

    event MintToSupporter(address indexed supporter, uint256 amount);

    constructor(
        string memory name_,
        string memory symbol_,
        address artist_,
        uint256 initialSupply_
    ) ERC20(name_, symbol_) Ownable(artist_) {
        require(artist_ != address(0), "Artist invalido");
        artist = artist_;

        if (initialSupply_ > 0) {
            _mint(artist_, initialSupply_);
        }
    }

    /**
     * @dev Permite al artista mintear más tokens para distribuir a seguidores.
     * En una versión más avanzada, esto podría estar restringido o gobernado.
     */
    function mintToSupporter(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Destino invalido");
        require(amount > 0, "Cantidad invalida");

        _mint(to, amount);
        emit MintToSupporter(to, amount);
    }
}

