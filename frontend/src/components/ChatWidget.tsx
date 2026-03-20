"use client";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/lib/chat-context";
import { useCart } from "@/lib/cart-context";
import { products, formatCOP, demoOrders } from "@/lib/data";
import { ChatMessage, ChatAction, Product } from "@/lib/types";



export default function ChatWidget() {
  const { isOpen, isFull, close, toggle, expand } = useChat();
  const { addItem } = useCart();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  function sendMessage(text: string) {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Motor RAG local — sin costos de API
    setTimeout(async () => {
      const { ragEngine } = await import("@/lib/rag-engine");
      const response = await ragEngine.processQuery(text);

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: response.content,
        actions: response.actions,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setIsTyping(false);

      if (response.transferRequested) {
        setTimeout(() => {
          const systemMsg: ChatMessage = {
            id: `sys-${Date.now()}`,
            role: "system",
            content: "🔄 Transfiriendo a un asesor humano experto...",
            timestamp: Date.now(),
          };
          setMessages((prev) => [...prev, systemMsg]);
        }, 1500);
      }
    }, 800 + Math.random() * 600);
  }

  function handleAction(action: ChatAction) {
    if (action.type === "add_to_cart") {
      const product = products.find((p) => p.id === action.payload);
      if (product) {
        addItem(product);
        const confirmMsg: ChatMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `✅ **${product.name}** agregado al carrito. ¿Quieres seguir comprando o ir al checkout?`,
          actions: [
            { type: "view_product", label: "Ir al carrito", payload: "/carrito" },
          ],
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, confirmMsg]);
      }
    } else if (action.type === "view_product" || action.type === "track_order") {
      window.location.href = action.payload.startsWith("/") ? action.payload : `/tienda/${action.payload}`;
    } else if (action.type === "handoff") {
      window.open(action.payload, "_blank");
    }
  }

  function handleQuickStart(text: string) {
    expand();
    sendMessage(text);
  }

  /* ─── MINI MODE (cerrado) ─── */
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={toggle}
          className="bg-vino text-white w-14 h-14 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-105 relative"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
          </svg>
          <span className="absolute -top-1 -right-1 bg-blush w-4 h-4 rounded-full animate-pulse-ring" />
        </button>
      </div>
    );
  }

  /* ─── MINI MODE (abierto pero no expandido) ─── */
  if (!isFull) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
        <div className="bg-white rounded-2xl shadow-xl w-72 overflow-hidden border border-blush/30">
          <div className="bg-vino text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">✨</div>
              <div>
                <p className="font-poppins font-semibold text-sm">Asesora Shelie</p>
                <p className="text-[10px] text-white/70">En línea</p>
              </div>
            </div>
            <button onClick={close} className="text-white/70 hover:text-white">✕</button>
          </div>
          <div className="p-4 space-y-2">
            <p className="text-sm text-carbon">¡Hola! 👋 ¿Qué buscas lograr?</p>
            <button onClick={() => handleQuickStart("Quiero controlar el frizz")} className="w-full text-left text-sm bg-blush/20 hover:bg-blush/30 rounded-xl px-4 py-2.5 transition-colors">
              💆‍♀️ Control de frizz
            </button>
            <button onClick={() => handleQuickStart("Quiero brillo y suavidad")} className="w-full text-left text-sm bg-blush/20 hover:bg-blush/30 rounded-xl px-4 py-2.5 transition-colors">
              ✨ Brillo y suavidad
            </button>
            <button onClick={() => handleQuickStart("Mi cabello está dañado, necesito reparación")} className="w-full text-left text-sm bg-blush/20 hover:bg-blush/30 rounded-xl px-4 py-2.5 transition-colors">
              🔧 Reparar daño
            </button>
            <button onClick={() => handleQuickStart("Tengo caída excesiva y quiero estimular el crecimiento")} className="w-full text-left text-sm bg-blush/20 hover:bg-blush/30 rounded-xl px-4 py-2.5 transition-colors">
              🌱 Anti-caída / Crecimiento
            </button>
            <button onClick={() => handleQuickStart("Qué servicios capilares ofrecen en sede")} className="w-full text-left text-sm bg-blush/20 hover:bg-blush/30 rounded-xl px-4 py-2.5 transition-colors">
              💈 Servicios en sede
            </button>
            <button onClick={expand} className="w-full text-xs text-humo hover:text-vino py-1">
              Escribir otra consulta →
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ─── FULL MODE ─── */
  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-white rounded-2xl shadow-2xl w-[360px] sm:w-[400px] h-[520px] flex flex-col overflow-hidden border border-blush/30">
        {/* Header */}
        <div className="bg-vino text-white p-4 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm">✨</div>
            <div>
              <p className="font-poppins font-semibold text-sm">Asesora Shelie</p>
              <p className="text-[10px] text-white/70">Responde al instante</p>
            </div>
          </div>
          <button onClick={close} className="text-white/70 hover:text-white text-lg">✕</button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-crema/50">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-humo mb-4">¡Hola! Soy tu asesora. Pregúntame lo que necesites.</p>
              <div className="space-y-2">
                {[
                "¿Qué me sirve para el frizz?",
                "¿Qué es el Oro Líquido Shelie's?",
                "¿Qué servicios tienen en sede?",
                "¿Cuánto cuesta el alisado orgánico?",
                "Tengo caída de cabello, ¿qué me recomiendan?",
                "¿Cuánto tarda el envío?",
              ].map((q) => (
                  <button key={q} onClick={() => sendMessage(q)} className="block w-full text-left text-xs bg-white hover:bg-blush/10 rounded-xl px-3 py-2 transition-colors text-humo">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "user"
                ? "bg-vino text-white rounded-br-md"
                : msg.role === "system"
                  ? "bg-blush/10 text-vino border border-vino/20 w-full text-center italic"
                  : "bg-white shadow-sm border border-blush/20 rounded-bl-md"
                }`}>
                {msg.content.split("\n").map((line, i) => (
                  <p key={i} className={i > 0 ? "mt-1" : ""}>
                    {line.replace(/\*\*(.*?)\*\*/g, (_, text) => text)}
                  </p>
                ))}
                {/* Actions */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {msg.actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(action)}
                        className={`block w-full text-left text-xs px-3 py-2 rounded-xl transition-colors ${action.type === "add_to_cart"
                          ? "bg-vino/10 text-vino hover:bg-vino/20 font-semibold"
                          : action.type === "handoff"
                            ? "bg-green-50 text-green-700 hover:bg-green-100"
                            : "bg-blush/20 text-carbon hover:bg-blush/30"
                          }`}
                      >
                        {action.type === "add_to_cart" && "🛒 "}
                        {action.type === "handoff" && "📱 "}
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white shadow-sm border border-blush/20 rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-humo/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-humo/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-humo/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-blush/20 flex gap-2 flex-shrink-0 bg-white">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Escribe tu pregunta..."
            className="flex-1 text-sm bg-crema/50 rounded-full px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-vino/20"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim()}
            className="bg-vino text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-opacity-90 disabled:opacity-40 transition-all"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
