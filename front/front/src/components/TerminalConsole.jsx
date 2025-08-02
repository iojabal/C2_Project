import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";

const TerminalConsole = () => {
  const terminalRef = useRef(null);
  const term = useRef(null);
  const socket = useRef(null);
  const inputBuffer = useRef("");

  useEffect(() => {
    term.current = new Terminal({
      fontSize: 14,
      theme: { background: "#1e1e1e", foreground: "#ffffff" },
      rows: 25,
      cols: 80,
      cursorBlink: true,
    });

    socket.current = new WebSocket("ws://localhost:5000/ws/console");

    term.current.open(terminalRef.current);
    term.current.focus();

    socket.current.onopen = () => {
      term.current.writeln("[*] WebSocket conectado.");
      term.current.writeln("Consola conectada. Escribe tu comando...");
      printPrompt();
    };

    socket.current.onmessage = (event) => {
      term.current.writeln(event.data);
      printPrompt();
    };

    socket.current.onerror = (err) => {
      term.current.writeln(`\r\n[!] WebSocket error: ${JSON.stringify(err)}`);
    };

    term.current.onKey(({ key, domEvent }) => {
      const code = domEvent.code;

      if (domEvent.ctrlKey || domEvent.altKey || domEvent.metaKey) {
        return; // Ignorar combinaciones especiales
      }

      switch (code) {
        case "Enter":
          term.current.write("\r\n");
          if (inputBuffer.current.trim() !== "") {
            socket.current.send(inputBuffer.current + "\n");
          }
          inputBuffer.current = "";
          break;

        case "Backspace":
          if (inputBuffer.current.length > 0) {
            inputBuffer.current = inputBuffer.current.slice(0, -1);
            term.current.write("\b \b");
          }
          break;

        default:
          inputBuffer.current += key;
          term.current.write(key);
          break;
      }
    });

    return () => {
      socket.current?.close();
      term.current?.dispose();
    };
  }, []);

  const printPrompt = () => {
    term.current?.write("> ");
  };

  return (
    <div
      ref={terminalRef}
      className="w-full h-full bg-black rounded shadow-lg"
      style={{ height: '100%', minHeight: '400px' }}
    />
  );
};

export default TerminalConsole;