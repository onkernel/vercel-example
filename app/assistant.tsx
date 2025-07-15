"use client";

import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { useChatRuntime } from "@assistant-ui/react-ai-sdk";
import { Thread } from "@/components/assistant-ui/thread";
import { TvFrame } from "@/components/ui/tv-frame";
import { BrowserSleeping } from "@/components/assistant-ui/browser-asleep";
import { Button } from "@/components/ui/button";
import React, { useState, useTransition, useEffect } from "react";
import { getBrowser, resetBrowser } from "./actions";

export const Assistant = () => {
  const [isOn, setIsOn] = React.useState(false);

  const [browser, setBrowser] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (isOn) {
      startTransition(async () => {
        const updatedBrowser = await getBrowser();
        if (updatedBrowser) {
          setBrowser(updatedBrowser);
        }
      });
    }
  }, [isOn]);

  const runtime = useChatRuntime({
    api: "/api/chat",
    onResponse(response) {
      console.log(response);
    },
  });

  const handleToggle = () => {
    setIsOn(!isOn);
  };

  const handleReset = () => {
    startTransition(async () => {
      await resetBrowser();
      const updatedBrowser = await getBrowser();
      if (updatedBrowser) {
        setBrowser(updatedBrowser);
      }
    });
  };

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div className="flex h-full w-full bg-[#261A47]">
        <div className="flex h-full w-1/3 justify-center bg-[#261A47]">
          <Thread />
        </div>
        <div className="flex h-full w-2/3 bg-purple-300">
          <div className="flex flex-col gap-4 justify-center bg-size-24 items-center w-full h-full p-24 bg-[url('https://upoevdcxa3.ufs.sh/f/IN4OjmY4wMHBHUb5GDTetaYDyhLAZzw6cGSTdRr5ob4P9Wuj')] bg-contain">
            <TvFrame borderImage="https://www.transparenttextures.com/patterns/squared-metal.png">
              {isOn && browser ? (
                <iframe src={browser} className="w-full h-full" />
              ) : (
                <BrowserSleeping setIsOn={setIsOn} />
              )}
            </TvFrame>
            <Button
              onClick={handleToggle}
              variant="outline"
              className={`px-6 py-2 text-lg font-medium border-2 border-white/30 focus-visible:border-white/50 focus-visible:ring-white/20 ${
                isOn
                  ? "bg-[#F9ECD3] text-[#261A47] hover:bg-[#F9ECD3]/90"
                  : "bg-[#261A47] text-white hover:bg-[#261A47]/90 hover:text-white"
              }`}
              size="lg"
            >
              {isOn ? "Turn Off" : "Turn On"}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="px-6 py-2 text-lg font-medium border-2 border-red-400/30 focus-visible:border-red-400/50 focus-visible:ring-red-400/20 bg-red-900 text-red-200 hover:bg-red-900 hover:text-red-100"
              size="lg"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>
    </AssistantRuntimeProvider>
  );
};
