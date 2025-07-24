import { backend } from "../../../declarations/backend";
import { Principal } from "@dfinity/principal";
import type {
  PoolConfig,
  AssetParameter,
  AssetTypes,
  Result,
  Result_1,
} from "../../../declarations/backend/backend.did";

/**
 * Service for handling all backend canister API calls
 */
export const backendService = {
  /**
   * Creates a new lending pool
   * @param poolConfig Pool configuration
   * @returns Promise with the result
   */
  async createPool(poolConfig: PoolConfig): Promise<Result_1> {
    return await backend.create_pool(poolConfig);
  },

  /**
   * Supplies tokens to a lending pool
   * @param tokenId Token ID
   * @param amount Amount to supply
   * @returns Promise with the result
   */
  async supply(tokenId: string, amount: bigint): Promise<Result> {
    return await backend.supply(tokenId, amount);
  },

  /**
   * Borrows tokens from a lending pool
   * @param tokenId Token ID
   * @param amount Amount to borrow
   * @returns Promise with the result
   */
  async borrow(tokenId: string, amount: bigint): Promise<Result> {
    return await backend.borrow(tokenId, amount);
  },

  /**
   * Repays borrowed tokens
   * @param tokenId Token ID
   * @param amount Amount to repay
   * @returns Promise with the result
   */
  async repay(tokenId: string, amount: bigint): Promise<Result> {
    return await backend.repay(tokenId, amount);
  },

  /**
   * Withdraws supplied tokens
   * @param tokenId Token ID
   * @param amount Amount to withdraw
   * @returns Promise with the result
   */
  async withdraw(tokenId: string, amount: bigint): Promise<Result> {
    return await backend.withdraw(tokenId, amount);
  },

  /**
   * Gets the current price of a token
   * @param token Token principal
   * @returns Promise with the price
   */
  async getPrice(token: Principal): Promise<number> {
    return await backend.get_price(token);
  },

  /**
   * Calculates the collateral value for a user
   * @param user User principal
   * @returns Promise with the collateral value
   */
  async getCollateralValue(user: Principal): Promise<number> {
    return await backend.cal_collateral_value(user);
  },

  /**
   * Calculates the borrow value for a user
   * @param user User principal
   * @returns Promise with the borrow value
   */
  async getBorrowValue(user: Principal): Promise<number> {
    return await backend.cal_borrow_value(user);
  },

  /**
   * Calculates the health factor for a user
   * @param user User principal
   * @returns Promise with the health factor
   */
  async getHealthFactor(user: Principal): Promise<number> {
    return await backend.cal_health_factor(user);
  },

  /**
   * Gets the interest rate for a token
   * @param token Token principal
   * @returns Promise with the interest rate
   */
  async getInterestRate(token: Principal): Promise<number> {
    return await backend.cal_interest(token);
  },

  /**
   * Checks user collateral for a specific token
   * @param token Token principal
   * @returns Promise with the list of collateral principals
   */
  async checkUserCollateral(token: Principal): Promise<Principal[]> {
    return await backend.check_user_collateral(token);
  },

  /**
   * Gets user collateral details
   * @param token Token principal
   * @returns Promise with the list of asset configurations
   */
  async getUserCollateral(token: Principal): Promise<any[]> {
    return await backend.spec_user_collateral(token);
  },

  /**
   * Updates contract assets
   * @param assetParam Asset parameter
   * @returns Promise that resolves when complete
   */
  async updateContractAssets(assetParam: AssetParameter): Promise<void> {
    return await backend.update_contract_assets(assetParam);
  },

  /**
   * Edits contract liquidation threshold
   * @param liquidation Liquidation threshold
   * @returns Promise that resolves when complete
   */
  async editContractLiquidation(liquidation: number): Promise<void> {
    return await backend.edit_contract_liquidation(liquidation);
  },
};
