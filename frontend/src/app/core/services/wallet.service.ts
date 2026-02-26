// POR QUE: El frontend necesita una forma centralizada de manejar la wallet.
//   Varios componentes (header, mint, verify) necesitan saber si el usuario
//   esta conectado, su direccion, y tener acceso al "signer" para firmar tx.
//   Sin un servicio central, cada componente manejaria su propia conexion
//   y se desincronizarian entre si.
//
// QUE: Servicio singleton que gestiona:
//   - Conexion/desconexion de la wallet (Pali Wallet via window.ethereum)
//   - Cambio automatico a la red zkSYS PoB Devnet
//   - Estado reactivo via signals (account, chainId, signer, isConnected)
//
// COMO: Usa signals de Angular para reactividad. Un signal es como una
//   variable especial: cuando su valor cambia, todos los componentes que
//   la leen se actualizan automaticamente. Es similar a un "Subject" de RxJS
//   pero mas simple.
//
//   La conexion con la wallet funciona asi:
//   1. Llamamos window.ethereum.request({method: 'eth_requestAccounts'})
//      Esto abre un popup en Pali Wallet pidiendo permiso
//   2. Si el usuario acepta, recibimos su direccion (ej: 0x1234...)
//   3. Creamos un BrowserProvider de ethers (puente entre la wallet y ethers.js)
//   4. Del provider obtenemos un Signer (objeto que puede firmar transacciones)
//   5. Verificamos que estemos en la red correcta, si no, pedimos cambiar

import { Injectable, signal, computed, NgZone } from '@angular/core';
import { ethers } from 'ethers';
import { environment } from '../../../environments/environment';

// Declaramos el tipo de window.ethereum para que TypeScript no se queje.
// window.ethereum es un objeto que inyectan las wallets como Pali o MetaMask.
// No existe en una ventana normal del navegador, solo si tienes la extension.
interface EthereumProvider {
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
  on(event: string, handler: (...args: unknown[]) => void): void;
  removeListener(event: string, handler: (...args: unknown[]) => void): void;
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  // Signals privados: solo este servicio puede escribir en ellos
  // Los componentes solo leen las versiones readonly (abajo)
  private readonly _account = signal<string | null>(null);
  private readonly _chainId = signal<number | null>(null);
  private readonly _provider = signal<ethers.BrowserProvider | null>(null);
  private readonly _signer = signal<ethers.JsonRpcSigner | null>(null);
  private readonly _isConnecting = signal(false);
  private readonly _error = signal<string | null>(null);

  // Signals publicos de solo lectura
  // .asReadonly() devuelve una version que los componentes pueden leer
  // pero no modificar
  readonly account = this._account.asReadonly();
  readonly chainId = this._chainId.asReadonly();
  readonly signer = this._signer.asReadonly();
  readonly isConnecting = this._isConnecting.asReadonly();
  readonly error = this._error.asReadonly();

  // Signal computado: se recalcula automaticamente cuando account o signer cambian
  // Es "true" cuando ambos tienen valor (usuario conectado + signer listo)
  readonly isConnected = computed(() => !!this._account() && !!this._signer());

  // Verifica si el navegador tiene una wallet instalada
  readonly hasWallet: boolean;
  private ethereum: EthereumProvider | null = null;

  constructor(private readonly ngZone: NgZone) {
    // Verificamos si window.ethereum existe (la wallet lo inyecta)
    // Casteamos window a unknown primero porque TypeScript estricto no permite
    // castear directamente Window a Record<string, unknown>
    const win = window as unknown as Record<string, unknown>;
    if (typeof window !== 'undefined' && win['ethereum']) {
      this.ethereum = win['ethereum'] as EthereumProvider;
      this.hasWallet = true;
      this.setupWalletListeners();
    } else {
      this.hasWallet = false;
    }
  }

  // Escucha cambios en la wallet (cambio de cuenta o de red)
  // Estos eventos los emite la extension de la wallet automaticamente
  private setupWalletListeners(): void {
    if (!this.ethereum) return;

    // Cuando el usuario cambia de cuenta en la wallet
    this.ethereum.on('accountsChanged', (accounts: unknown) => {
      // NgZone.run() le avisa a Angular que hubo un cambio externo
      // Sin esto, Angular no detectaria el cambio porque viene de fuera del framework
      this.ngZone.run(() => {
        const accs = accounts as string[];
        if (accs.length === 0) {
          this.disconnect();
        } else {
          this._account.set(accs[0]);
        }
      });
    });

    // Cuando el usuario cambia de red en la wallet
    this.ethereum.on('chainChanged', () => {
      // Recargamos la pagina porque cambiar de red puede invalidar el contrato
      this.ngZone.run(() => {
        window.location.reload();
      });
    });
  }

  // Cambia a la red zkSYS PoB Devnet si el usuario esta en otra red.
  // Internamente envia una peticion JSON-RPC a la wallet:
  // 1. wallet_switchEthereumChain: intenta cambiar a una red ya conocida
  // 2. Si la wallet no la conoce (error 4902), llama a wallet_addEthereumChain
  //    para agregarla primero
  private async ensureCorrectNetwork(): Promise<void> {
    if (!this.ethereum) return;

    const currentChainId = await this.ethereum.request({ method: 'eth_chainId' });

    if (currentChainId !== environment.chainIdHex) {

      try {
        await this.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: environment.chainIdHex }],
        });
      } catch (switchError: unknown) {
        const err = switchError as { code?: number };
        // Codigo 4902 = la red no esta agregada en la wallet
        if (err.code === 4902) {

          await this.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [environment.networkConfig],
          });
        } else {
          throw switchError;
        }
      }
    }
  }

  // Conecta la wallet del usuario. Proceso completo:
  // 1. Pide permiso al usuario (popup de Pali)
  // 2. Obtiene la direccion de la cuenta
  // 3. Cambia a la red correcta
  // 4. Crea provider y signer de ethers.js
  async connect(): Promise<void> {


    if (!this.ethereum) {

      this._error.set('Necesitas Pali Wallet instalada');
      return;
    }


    this._isConnecting.set(true);
    this._error.set(null);

    try {
      // Paso 1: Pedir permiso para acceder a las cuentas
      // Esto abre un popup en la wallet del usuario

      const accounts = await this.ethereum.request({
        method: 'eth_requestAccounts',
      }) as string[];

      this._account.set(accounts[0]);


      // Paso 2: Cambiar a la red zkSYS PoB Devnet si es necesario

      await this.ensureCorrectNetwork();

      // Paso 3: Crear provider y signer de ethers.js
      // BrowserProvider: puente entre la wallet (window.ethereum) y ethers.js
      // Es un "envoltorio" que traduce las peticiones de ethers al formato
      // que entiende la wallet

      const browserProvider = new ethers.BrowserProvider(this.ethereum as ethers.Eip1193Provider);
      this._provider.set(browserProvider);


      // getSigner(): obtiene un objeto que puede FIRMAR transacciones
      // Internamente usa la clave privada guardada en la wallet (nunca sale de ahi)

      const browserSigner = await browserProvider.getSigner();
      this._signer.set(browserSigner);


      // Paso 4: Obtener el chainId actual para verificar la red

      const network = await browserProvider.getNetwork();
      this._chainId.set(Number(network.chainId));



    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);

      this._error.set(message);
    } finally {
      this._isConnecting.set(false);

    }
  }

  // Desconecta la wallet (solo limpia el estado local, no cierra la wallet)
  disconnect(): void {
    this._account.set(null);
    this._chainId.set(null);
    this._provider.set(null);
    this._signer.set(null);
    this._error.set(null);

  }
}
