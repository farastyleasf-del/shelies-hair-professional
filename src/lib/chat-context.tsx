"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface ChatContextType {
  isOpen: boolean;
  isFull: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  expand: () => void;
  collapse: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isFull, setIsFull] = useState(false);

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        isFull,
        open: () => { setIsOpen(true); setIsFull(true); },
        close: () => { setIsOpen(false); setIsFull(false); },
        toggle: () => setIsOpen((p) => !p),
        expand: () => setIsFull(true),
        collapse: () => setIsFull(false),
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be inside ChatProvider");
  return ctx;
}
