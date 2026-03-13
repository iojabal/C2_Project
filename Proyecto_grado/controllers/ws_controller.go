package controllers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"proyecto_grado/models"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

// ——— Consola de operadores ———
var (
	consoleMutex   sync.Mutex
	ConsoleClients = make(map[*websocket.Conn]bool)
)

// ——— WebSocket de lista de agentes ———
var (
	clientsMu       sync.Mutex
	agentsWSClients = make(map[*websocket.Conn]bool)
)

// ——— Mapa de agentes conectados ———
var (
	agentsMu        sync.Mutex
	ConnectedAgents = make(map[string]*models.Agent) // clave: UUID
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// snapshot seguro de ConnectedAgents
func agentsSlice() []*models.Agent {
	agentsMu.Lock()
	defer agentsMu.Unlock()

	out := make([]*models.Agent, 0, len(ConnectedAgents))
	for _, a := range ConnectedAgents {
		out = append(out, a)
	}
	return out
}

// Emite la lista de agentes a todos los clientes suscritos
func broadcastAgents() {
	// 1) Sacamos snapshot bajo agentsMu
	snapshot := agentsSlice()

	// 2) Enviamos snapshot a cada cliente bajo clientsMu
	clientsMu.Lock()
	defer clientsMu.Unlock()
	for c := range agentsWSClients {
		if err := c.WriteJSON(snapshot); err != nil {
			log.Println("[-] Error broadcasting agents:", err)
			c.Close()
			delete(agentsWSClients, c)
		}
	}
}

// Emite mensajes a la consola de operadores
func broadcastToOperators(message string) {
	consoleMutex.Lock()
	defer consoleMutex.Unlock()

	for conn := range ConsoleClients {
		if err := conn.WriteMessage(websocket.TextMessage, []byte(message)); err != nil {
			log.Println("[-] Error enviando al operador:", err)
			conn.Close()
			delete(ConsoleClients, conn)
		}
	}
}

// Maneja suscripciones a /ws/agents para lista en tiempo real
func AgentsWSHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("[-] Upgrade agents WS:", err)
		return
	}

	clientsMu.Lock()
	agentsWSClients[conn] = true
	clientsMu.Unlock()

	// Limpiar al desconectar
	defer func() {
		clientsMu.Lock()
		delete(agentsWSClients, conn)
		clientsMu.Unlock()
		conn.Close()
	}()

	// Envío inicial de la lista
	if err := conn.WriteJSON(agentsSlice()); err != nil {
		log.Println("[-] Error enviando lista inicial:", err)
		return
	}

	// Bloquear para mantener la conexión viva hasta que el cliente cierre.
	// El frontend no envía mensajes pero ReadMessage bloqueará hasta
	// que haya un error de red o cierre desde el cliente.
	for {
		if _, _, err := conn.ReadMessage(); err != nil {
			break
		}
	}
}

// Maneja conexiones de agentes en /ws
func WSHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("[-] Error en WebSocket upgrade:", err)
		return
	}

	// Leo el mensaje beacon
	_, beaconMsg, err := conn.ReadMessage()
	if err != nil {
		log.Println("[-] Error leyendo beacon:", err)
		conn.Close()
		return
	}

	var agent models.Agent
	if err := json.Unmarshal(beaconMsg, &agent); err != nil {
		log.Println("[-] Beacon inválido:", err)
		conn.Close()
		return
	}

	// Inicializo campos
	agent.Conn = conn
	agent.Connected = true
	agent.Active = true
	agent.LastSeen = time.Now().Format(time.RFC3339)
	agent.Save()

	// Registro en el mapa
	agentsMu.Lock()
	ConnectedAgents[agent.UUID] = &agent
	agentsMu.Unlock()

	// Notifico a los suscriptores de /ws/agents
	broadcastAgents()

	// Arranco la rutina de lectura de mensajes
	go handleAgent(&agent)
}

func handleAgent(agent *models.Agent) {
	defer func() {
		agent.Conn.Close()

		// Quito del mapa
		agentsMu.Lock()
		delete(ConnectedAgents, agent.UUID)
		agentsMu.Unlock()

		// Marco desconectado en base de datos
		if err := agent.MarkDisconnected(); err != nil {
			log.Printf("[-] Error actualizando agente %s: %v", agent.UUID, err)
		}

		// Notifico la desconexión
		broadcastAgents()
	}()

	for {
		_, msg, err := agent.Conn.ReadMessage()
		if err != nil {
			log.Println("[-] Error leyendo mensaje:", err)
			break
		}
		// Reenvío a la consola de operadores
		broadcastToOperators(fmt.Sprintf(" %s", msg))
	}
}
