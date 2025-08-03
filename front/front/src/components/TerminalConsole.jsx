import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";

export default function TerminalConsole({ agentId }) {
  const terminalRef = useRef(null);
  const term = useRef(null);
  const fitAddon = useRef(null);
  const socket = useRef(null);
  const inputBuffer = useRef("");

  useEffect(() => {
    // Inicializa terminal
    term.current = new Terminal({
      fontSize: 14,
      theme: { background: "#000000", foreground: "#38a169" }, // text-green-400 on black
      cursorBlink: true,
      convertEol: true, // Convierte \n a \r\n automáticamente
    });

    fitAddon.current = new FitAddon();
    term.current.loadAddon(fitAddon.current);

    term.current.open(terminalRef.current);
    fitAddon.current.fit();

    window.addEventListener("resize", fitAddon.current.fit);

    // Conexión WebSocket
    socket.current = new WebSocket("ws://localhost:5000/ws/console");
    socket.current.onopen = () => {
      printPrompt();
    };
    socket.current.onmessage = (evt) => {
      // Procesar la respuesta para manejar saltos de línea correctamente
      let response = evt.data.toString();
      
      // Escribir la respuesta con saltos de línea explícitos
      term.current.write('\r\n' + response.replace(/\n/g, '\r\n'));
      if (!response.endsWith('\n')) {
        term.current.write('\r\n');
      }
      
      printPrompt();
    };
    socket.current.onerror = (err) => console.error(err);

    term.current.onKey(({ key, domEvent }) => {
      const code = domEvent.code;
      if (domEvent.ctrlKey || domEvent.altKey || domEvent.metaKey) return;
      switch (code) {
        case "Enter":
          term.current.write("\r\n");
          if (inputBuffer.current.trim()) {
            socket.current.send(inputBuffer.current + "\n");
          } else {
            // Si no hay comando, mostrar prompt inmediatamente
            printPrompt();
          }
          inputBuffer.current = "";
          break;
        case "Backspace":
          if (inputBuffer.current.length) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            term.current.write("\b \b");
          }
          break;
        default:
          inputBuffer.current += key;
          term.current.write(key);
      }
    });

    return () => {
      window.removeEventListener("resize", fitAddon.current.fit);
      socket.current?.close();
      term.current?.dispose();
    };
  }, [agentId]);

  const printPrompt = () => {
    // user@agent:~$ in blue, then reset, then space
    term.current.write(`\x1b[34muser@${agentId}:~$\x1b[0m `);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="bg-black text-green-400 p-4 rounded-t-lg font-mono">
        Terminal conectada al agente: {agentId}
      </div>
      <div
        ref={terminalRef}
        className="flex-1 bg-black rounded-b-lg overflow-hidden font-mono"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}