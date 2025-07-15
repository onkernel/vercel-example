"use client";

import { Button } from "@/packages/web/components/ui/button";

export const StartBrowser = () => {
  const handleStartBrowser = () => {
    // TODO: Implement browser start functionality
    console.log("Starting browser...");
  };

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold text-white">Start Browser</h2>
        <p className="text-white/80 max-w-md">
          Click the button below to start a new browser session for web
          automation and browsing tasks.
        </p>
      </div>
      <Button
        onClick={handleStartBrowser}
        className="px-8 py-3 text-lg font-medium bg-white text-[#261A47] hover:bg-white/90"
        size="lg"
      >
        Start Browser
      </Button>
    </div>
  );
};
