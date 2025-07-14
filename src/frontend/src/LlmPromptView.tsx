import React, { useState } from "react";
import { Button, Card, TextArea } from "./components";
import { backendService } from "./services/backendService";

interface LlmPromptViewProps {
  onError: (error: string) => void;
  setLoading: (loading: boolean) => void;
}

/**
 * LlmPromptView component for handling LLM prompt interactions
 */
export function LlmPromptView({ onError, setLoading }: LlmPromptViewProps) {
  const [prompt, setPrompt] = useState<string>("");
  const [response, setResponse] = useState<string>("");

  const handleChangePrompt = (
    event: React.ChangeEvent<HTMLTextAreaElement>,
  ): void => {
    if (!event?.target.value && event?.target.value !== "") {
      return;
    }
    setPrompt(event.target.value);
  };

  const sendPrompt = async () => {
    try {
      setLoading(true);
      const res = await backendService.sendLlmPrompt(prompt);
      setResponse(res);
    } catch (err) {
      console.error(err);
      onError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="LLM Prompt">
      <TextArea
        value={prompt}
        onChange={handleChangePrompt}
        placeholder="Enter your prompt here..."
        rows={4}
      />
      <Button onClick={sendPrompt} disabled={!prompt.trim()}>
        Send Prompt
      </Button>
      {response && (
        <div className="mt-4 p-4 bg-gray-100 rounded-lg">
          <h3 className="font-semibold mb-2">Response:</h3>
          <p className="whitespace-pre-wrap">{response}</p>
        </div>
      )}
    </Card>
  );
}
