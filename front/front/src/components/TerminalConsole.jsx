import React, { useEffect, useRef, useState, useCallback } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import { Copy, Maximize2, Minimize2, X, Wifi, WifiOff } from "lucide-react";

const WS_URL = "ws://localhost:5000/ws/console";

export default function TerminalConsole({ agentId }) {
  const terminalRef = useRef(null);
  const term = useRef(null);
  const fitAddon = useRef(null);
  const socket = useRef(null);
  const inputBuffer = useRef("");
  const cmdHistory = useRef([]);
  const historyIndex = useRef(-1);

  const [wsStatus, setWsStatus] = useState("connecting"); // connecting | connected | disconnected
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sessionStart] = useState(new Date());

  const printPrompt = useCallback(() => {
    term.current?.write(`\x1b[1;32mroot\x1b[0m\x1b[37m@\x1b[0m\x1b[1;36m${agentId.slice(0, 8)}\x1b[0m\x1b[37m:~#\x1b[0m `);
  }, [agentId]);

  const clearTerminal = useCallback(() => {
    term.current?.clear();
    term.current?.write("\x1bc");
    printPrompt();
  }, [printPrompt]);

  useEffect(() => {
    // Init terminal
    term.current = new Terminal({
      fontSize: 13,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Menlo, Monaco, monospace",
      theme: {
        background: "#0d1117",
        foreground: "#c9d1d9",
        cursor: "#58a6ff",
        cursorAccent: "#0d1117",
        selection: "#264f78",
        black: "#0d1117",
        red: "#ff7b72",
        green: "#3fb950",
        yellow: "#d29922",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39c5cf",
        white: "#b1bac4",
        brightBlack: "#6e7681",
        brightRed: "#ffa198",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d4dd",
        brightWhite: "#f0f6fc",
      },
      cursorBlink: true,
      cursorStyle: "block",
      convertEol: true,
      scrollback: 5000,
      allowTransparency: true,
    });

    fitAddon.current = new FitAddon();
    term.current.loadAddon(fitAddon.current);
    term.current.open(terminalRef.current);

    setTimeout(() => fitAddon.current?.fit(), 50);

    const handleResize = () => fitAddon.current?.fit();
    window.addEventListener("resize", handleResize);

    // Banner de bienvenida
    term.current.writeln("\x1b[1;32m╔══════════════════════════════════════════════════╗\x1b[0m");
    term.current.writeln(`\x1b[1;32m║\x1b[0m  \x1b[1;36mSesión iniciada\x1b[0m  →  \x1b[1;33m${agentId}\x1b[0m`);
    term.current.writeln(`\x1b[1;32m║\x1b[0m  \x1b[37m${sessionStart.toLocaleString()}\x1b[0m`);
    term.current.writeln("\x1b[1;32m╚══════════════════════════════════════════════════╝\x1b[0m");
    term.current.writeln("");

    // WebSocket
    const connectWS = () => {
      setWsStatus("connecting");
      socket.current = new WebSocket(WS_URL);

      socket.current.onopen = () => {
        setWsStatus("connected");
        term.current?.writeln("\x1b[1;32m[+] Conexión establecida con el agente\x1b[0m\r\n");
        printPrompt();
      };

      socket.current.onmessage = (evt) => {
        const response = evt.data.toString();
        term.current?.write("\r\n" + response.replace(/\n/g, "\r\n"));
        if (!response.endsWith("\n")) term.current?.write("\r\n");
        printPrompt();
      };

      socket.current.onerror = () => {
        setWsStatus("disconnected");
        term.current?.writeln("\r\n\x1b[1;31m[!] Error de conexión WebSocket\x1b[0m");
      };

      socket.current.onclose = () => {
        setWsStatus("disconnected");
        term.current?.writeln("\r\n\x1b[1;33m[~] Conexión cerrada\x1b[0m");
      };
    };

    connectWS();

    // Keyboard handler
    term.current.onKey(({ key, domEvent }) => {
      const { code, ctrlKey } = domEvent;

      // Ctrl+L → limpiar
      if (ctrlKey && code === "KeyL") {
        domEvent.preventDefault();
        clearTerminal();
        return;
      }

      // Ctrl+C → cancelar
      if (ctrlKey && code === "KeyC") {
        term.current.write("^C\r\n");
        inputBuffer.current = "";
        historyIndex.current = -1;
        printPrompt();
        return;
      }

      if (ctrlKey || domEvent.altKey || domEvent.metaKey) return;

      switch (code) {
        case "Enter": {
          const cmd = inputBuffer.current.trim();
          term.current.write("\r\n");
          if (cmd) {
            cmdHistory.current.unshift(cmd);
            if (cmdHistory.current.length > 100) cmdHistory.current.pop();
            historyIndex.current = -1;
            socket.current?.send(cmd + "\n");
          } else {
            printPrompt();
          }
          inputBuffer.current = "";
          break;
        }
        case "Backspace":
          if (inputBuffer.current.length) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            term.current.write("\b \b");
          }
          break;
        case "ArrowUp": {
          domEvent.preventDefault();
          const nextIdx = Math.min(historyIndex.current + 1, cmdHistory.current.length - 1);
          if (cmdHistory.current[nextIdx] !== undefined) {
            // Borrar lo que hay en el buffer visual
            term.current.write("\b \b".repeat(inputBuffer.current.length));
            historyIndex.current = nextIdx;
            inputBuffer.current = cmdHistory.current[nextIdx];
            term.current.write(inputBuffer.current);
          }
          break;
        }
        case "ArrowDown": {
          domEvent.preventDefault();
          const prevIdx = historyIndex.current - 1;
          term.current.write("\b \b".repeat(inputBuffer.current.length));
          if (prevIdx >= 0) {
            historyIndex.current = prevIdx;
            inputBuffer.current = cmdHistory.current[prevIdx];
          } else {
            historyIndex.current = -1;
            inputBuffer.current = "";
          }
          term.current.write(inputBuffer.current);
          break;
        }
        default:
          inputBuffer.current += key;
          term.current.write(key);
      }
    });

    return () => {
      window.removeEventListener("resize", handleResize);
      socket.current?.close();
      term.current?.dispose();
    };
  }, [agentId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refitear cuando cambia el modo fullscreen
  useEffect(() => {
    setTimeout(() => fitAddon.current?.fit(), 100);
  }, [isFullscreen]);

  const statusColor = {
    connected: "text-emerald-400",
    disconnected: "text-red-400",
    connecting: "text-yellow-400",
  };

  const statusLabel = {
    connected: "Conectado",
    disconnected: "Desconectado",
    connecting: "Conectando...",
  };

  return (
    <div
      className={`flex flex-col rounded-lg overflow-hidden border border-gray-700/60 shadow-2xl shadow-black/50 ${
        isFullscreen ? "fixed inset-0 z-50 rounded-none" : "h-full"
      }`}
      style={{ background: "#0d1117" }}
    >
      {/* Titlebar estilo macOS */}
      <div
        className="flex items-center justify-between px-4 py-2.5 select-none"
        style={{
          background: "linear-gradient(180deg, #1c2128 0%, #161b22 100%)",
          borderBottom: "1px solid #30363d",
        }}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors cursor-default" title="Cerrar" />
          <div className="w-3 h-3 rounded-full bg-yellow-500 hover:bg-yellow-400 transition-colors cursor-default" title="Minimizar" />
          <div className="w-3 h-3 rounded-full bg-green-500 hover:bg-green-400 transition-colors cursor-default" title="Maximizar" />
        </div>

        {/* Title */}
        <div className="flex items-center gap-2 text-sm font-mono">
          <span className="text-gray-500">bash</span>
          <span className="text-gray-600">—</span>
          <span className="text-gray-300 font-medium">{agentId.slice(0, 8)}...</span>
          <span className="text-gray-600">—</span>
          <span className="text-gray-500">80×24</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className={`flex items-center gap-1.5 text-xs font-medium ${statusColor[wsStatus]}`}>
            {wsStatus === "connected" ? (
              <Wifi size={12} />
            ) : (
              <WifiOff size={12} />
            )}
            <span>{statusLabel[wsStatus]}</span>
          </div>

          {/* Separador */}
          <div className="w-px h-4 bg-gray-600" />

          {/* Copiar / Fullscreen */}
          <button
            onClick={() => {
              const sel = term.current?.getSelection();
              if (sel) navigator.clipboard.writeText(sel).catch(() => {});
            }}
            className="text-gray-500 hover:text-gray-200 transition-colors"
            title="Copiar selección"
          >
            <Copy size={13} />
          </button>
          <button
            onClick={() => setIsFullscreen((f) => !f)}
            className="text-gray-500 hover:text-gray-200 transition-colors"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={terminalRef}
        className="flex-1 overflow-hidden"
        style={{ padding: "8px 4px 4px 4px" }}
      />

      {/* Status bar inferior */}
      <div
        className="flex items-center justify-between px-4 py-1 text-xs font-mono"
        style={{
          background: "#161b22",
          borderTop: "1px solid #21262d",
          color: "#6e7681",
        }}
      >
        <div className="flex items-center gap-4">
          <span>
            <span className="text-gray-600">AGENTE </span>
            <span className="text-blue-400">{agentId}</span>
          </span>
          <span>
            <span className="text-gray-600">HISTORIAL </span>
            <span className="text-gray-400">{cmdHistory.current.length} cmds</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">
            Ctrl+L limpiar · Ctrl+C cancelar · ↑↓ historial
          </span>
          <span>
            <span className="text-gray-600">SESIÓN </span>
            <span className="text-gray-400">{sessionStart.toLocaleTimeString()}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
