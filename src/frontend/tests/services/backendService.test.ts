import { describe, it, expect, vi, beforeEach } from "vitest";
import { backendService } from "../../src/services/backendService";
import { backend } from "../../../declarations/backend";
import { Principal } from "@dfinity/principal";

// Mock the backend canister
vi.mock("../../../declarations/backend", () => ({
  backend: {
    create_pool: vi.fn().mockResolvedValue({ Ok: null }),
    supply: vi.fn().mockResolvedValue({ Ok: BigInt(100) }),
    borrow: vi.fn().mockResolvedValue({ Ok: BigInt(50) }),
    repay: vi.fn().mockResolvedValue({ Ok: BigInt(25) }),
    withdraw: vi.fn().mockResolvedValue({ Ok: BigInt(75) }),
    get_price: vi.fn().mockResolvedValue(1.5),
    cal_collateral_value: vi.fn().mockResolvedValue(1000.0),
    cal_borrow_value: vi.fn().mockResolvedValue(500.0),
    cal_health_factor: vi.fn().mockResolvedValue(2.0),
    cal_interest: vi.fn().mockResolvedValue(0.05),
    check_user_collateral: vi.fn().mockResolvedValue([]),
    spec_user_collateral: vi.fn().mockResolvedValue([]),
    update_contract_assets: vi.fn().mockResolvedValue(undefined),
    edit_contract_liquidation: vi.fn().mockResolvedValue(undefined),
  },
}));

describe("backendService", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("createPool", () => {
    it("should call backend.create_pool with the provided config", async () => {
      const poolConfig = {
        name: "Test Pool",
        token_id: "test-token",
        collateral: ["collateral1", "collateral2"],
        maximum_token: [] as [] | [bigint],
      };

      // Execute
      const result = await backendService.createPool(poolConfig);

      // Assert
      expect(backend.create_pool).toHaveBeenCalledWith(poolConfig);
      expect(result).toEqual({ Ok: null });
    });
  });

  describe("supply", () => {
    it("should call backend.supply with the provided parameters", async () => {
      // Execute
      const result = await backendService.supply("test-token", BigInt(100));

      // Assert
      expect(backend.supply).toHaveBeenCalledWith("test-token", BigInt(100));
      expect(result).toEqual({ Ok: BigInt(100) });
    });
  });

  describe("borrow", () => {
    it("should call backend.borrow with the provided parameters", async () => {
      // Execute
      const result = await backendService.borrow("test-token", BigInt(50));

      // Assert
      expect(backend.borrow).toHaveBeenCalledWith("test-token", BigInt(50));
      expect(result).toEqual({ Ok: BigInt(50) });
    });
  });

  describe("getPrice", () => {
    it("should call backend.get_price with the provided token", async () => {
      const token = Principal.fromText("aaaaa-aa");

      // Execute
      const result = await backendService.getPrice(token);

      // Assert
      expect(backend.get_price).toHaveBeenCalledWith(token);
      expect(result).toBe(1.5);
    });
  });

  describe("getCollateralValue", () => {
    it("should call backend.cal_collateral_value with the provided user", async () => {
      const user = Principal.fromText("aaaaa-aa");

      // Execute
      const result = await backendService.getCollateralValue(user);

      // Assert
      expect(backend.cal_collateral_value).toHaveBeenCalledWith(user);
      expect(result).toBe(1000.0);
    });
  });
});
