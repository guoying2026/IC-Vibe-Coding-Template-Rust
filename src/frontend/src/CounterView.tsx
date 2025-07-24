import React, { useState, useEffect } from "react";
import { Button, Card, ErrorDisplay, Loader } from "./components";
import { backendService } from "./services/backendService";
import { Principal } from "@dfinity/principal";

interface LendingViewProps {
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * LendingView component for handling the lending contract functionality
 */
export function LendingView({ onError, setLoading }: LendingViewProps) {
  const [collateralValue, setCollateralValue] = useState<number>(0);
  const [borrowValue, setBorrowValue] = useState<number>(0);
  const [healthFactor, setHealthFactor] = useState<number>(0);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      // Use a default principal for demo purposes
      const user = Principal.fromText("aaaaa-aa");
      const collateral = await backendService.getCollateralValue(user);
      const borrow = await backendService.getBorrowValue(user);
      const health = await backendService.getHealthFactor(user);

      setCollateralValue(collateral);
      setBorrowValue(borrow);
      setHealthFactor(health);
    } catch (err) {
      console.error(err);
      onError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const createPool = async () => {
    try {
      setLoading(true);
      const poolConfig = {
        name: "Demo Pool",
        token_id: "demo-token",
        collateral: ["collateral1"],
        maximum_token: [] as [] | [bigint],
      };
      const result = await backendService.createPool(poolConfig);
      if ("Ok" in result) {
        onError("Pool created successfully!");
      } else {
        onError(result.Err || "Failed to create pool");
      }
    } catch (err) {
      console.error(err);
      onError(String(err));
    } finally {
      setLoading(false);
    }
  };

  // Fetch the initial stats when component mounts
  useEffect(() => {
    fetchUserStats();
  }, []);

  return (
    <Card title="Lending Contract Dashboard">
      <div style={{ marginBottom: "1rem" }}>
        <p>
          <strong>Collateral Value:</strong> ${collateralValue.toFixed(2)}
        </p>
        <p>
          <strong>Borrow Value:</strong> ${borrowValue.toFixed(2)}
        </p>
        <p>
          <strong>Health Factor:</strong> {healthFactor.toFixed(2)}
        </p>
      </div>
      <Button onClick={createPool}>Create Demo Pool</Button>
      <Button onClick={fetchUserStats}>Refresh Stats</Button>
    </Card>
  );
}
