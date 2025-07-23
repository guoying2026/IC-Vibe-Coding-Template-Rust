import React, { useState } from "react";
import { Button, Card, ErrorDisplay, InputField } from "./components";
import { backendService } from "./services/backendService";

interface BorrowViewProps {
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * BorrowView component for handling token borrowing functionality
 */
export function BorrowView({ onError, setLoading }: BorrowViewProps) {
  const [tokenId, setTokenId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const handleBorrow = async () => {
    if (!tokenId || !amount) {
      onError("Please enter both token ID and amount");
      return;
    }

    try {
      setLoading(true);
      const result = await backendService.borrow(tokenId, BigInt(amount));
      if ("Ok" in result) {
        onError(`Borrow successful! Block index: ${result.Ok}`);
      } else {
        onError(result.Err || "Borrow failed");
      }
    } catch (err) {
      console.error(err);
      onError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="Borrow Tokens">
      <div style={{ marginBottom: "1rem" }}>
        <InputField
          value={tokenId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTokenId(e.target.value)}
          placeholder="Enter token ID"
        />
        <InputField
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
          placeholder="Enter amount"
          type="number"
        />
      </div>
      <Button onClick={handleBorrow}>Borrow Tokens</Button>
    </Card>
  );
}
