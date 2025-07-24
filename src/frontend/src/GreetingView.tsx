import React, { useState } from "react";
import { Button, Card, ErrorDisplay, InputField } from "./components";
import { backendService } from "./services/backendService";

interface SupplyViewProps {
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * SupplyView component for handling token supply functionality
 */
export function SupplyView({ onError, setLoading }: SupplyViewProps) {
  const [tokenId, setTokenId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const handleSupply = async () => {
    if (!tokenId || !amount) {
      onError("Please enter both token ID and amount");
      return;
    }

    try {
      setLoading(true);
      const result = await backendService.supply(tokenId, BigInt(amount));
      if ("Ok" in result) {
        onError(`Supply successful! Block index: ${result.Ok}`);
      } else {
        onError(result.Err || "Supply failed");
      }
    } catch (err) {
      console.error(err);
      onError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Supply Tokens">
      <div style={{ marginBottom: "1rem" }}>
        <InputField
          value={tokenId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setTokenId(e.target.value)
          }
          placeholder="Enter token ID"
        />
        <InputField
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setAmount(e.target.value)
          }
          placeholder="Enter amount"
          type="number"
        />
      </div>
      <Button onClick={handleSupply}>Supply Tokens</Button>
    </Card>
  );
}
