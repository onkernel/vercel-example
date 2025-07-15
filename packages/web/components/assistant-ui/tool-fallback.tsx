import { ToolCallContentPartComponent } from "@assistant-ui/react";
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "../ui/button";

export const ToolFallback: ToolCallContentPartComponent = ({
  toolName,
  argsText,
  result,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  return (
    <div className="mb-4 flex w-full flex-col gap-3 rounded-lg border border-white/20 bg-white/5 py-3">
      <div className="flex items-center gap-2 px-4">
        <CheckIcon className="size-4 text-white" />
        <p className="text-white">
          Used tool: <b>{toolName}</b>
        </p>
        <div className="flex-grow" />
        <Button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="bg-white text-[#261A47] hover:bg-white/90"
        >
          {isCollapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </Button>
      </div>
      {!isCollapsed && (
        <div className="flex flex-col gap-2 border-t border-white/20 pt-2">
          <div className="px-4">
            <pre className="whitespace-pre-wrap text-white">{argsText}</pre>
          </div>
          {result !== undefined && (
            <div className="border-t border-dashed border-white/20 px-4 pt-2">
              <p className="font-semibold text-white">Result:</p>
              <pre className="whitespace-pre-wrap text-white">
                {typeof result === "string"
                  ? result
                  : JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
