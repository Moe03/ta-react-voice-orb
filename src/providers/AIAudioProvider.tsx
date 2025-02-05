"use client";
import React, { createContext, ReactNode, useContext, useState } from "react";
declare module "react" {
  interface CSSProperties {
    [key: `--${string}`]: string | number;
  }
}
import { WebCall } from "@tixae-labs/web-sdk";
import {
  InitCallOptionsType,
  InitWebRtcCall,
} from "../../../../app/Types/firebase";

const VoiceContext = createContext<VoiceProviderProps | null>(null);

export type VoiceProviderProps = {
  webCall: WebCall;
  callState: "idle" | "connecting" | "connected";
  isMuted: boolean;
};

export function useAIVoice() {
  const context = useContext<VoiceProviderProps | null>(VoiceContext);
  if (!context) {
    throw new Error(
      "use tixae voice must be used within a tixae voice provider"
    );
  }
  return context;
}

const VoiceProvider = (props: {
  children: ReactNode;
  agentId: string;
  region: "eu" | "na";
  initCallOptions?: InitCallOptionsType;
}) => {

  const [tixaeVoice, setTixaeVoice] = React.useState<WebCall>(
    new WebCall()
  );
  const [callState, setCallState] = React.useState<
    "idle" | "connecting" | "connected"
  >("idle");
  const [isMuted, setIsMuted] = React.useState(false);

  async function initVoice() {
    await tixaeVoice.init({
      agentId: props.agentId,
      region: props.region,
      options: props.initCallOptions,
    });

    setTixaeVoice(tixaeVoice);

    tixaeVoice.on("call-start", () => {
      console.log(`call has started..`);
    });
    tixaeVoice.on("call-end", () => {
      console.log(`call has ended..`);
    });

    // must handle errors
    tixaeVoice.on("error", (error) => {
      console.error(`error`, error);
    });

    tixaeVoice.on("conversation-update", (payload) => {
      console.log(`conversation-update`, payload);
    });

    tixaeVoice.on("state-change", (state) => {
      console.log(`state-change`, state);
      setCallState(state);
    });

    tixaeVoice.on("mute-change", (isMuted) => {
      console.log(`mute-change`, isMuted);
      setIsMuted(isMuted);
    });
  }

  React.useEffect(() => {
    initVoice();
  }, []);

  const value: VoiceProviderProps = {
    webCall: tixaeVoice,
    callState: callState,
    isMuted: isMuted,
  };

  return (
    <VoiceContext.Provider value={value}>
      {props.children}
    </VoiceContext.Provider>
  );
};

export default VoiceProvider;
