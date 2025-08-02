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

// var ConsoleClients = make(map[*websocket.Conn]bool)
var consoleMutex sync.Mutex

func broadcastToOperators(message string) {
	consoleMutex.Lock()
	defer consoleMutex.Unlock()
	for conn := range ConsoleClients {
		err := conn.WriteMessage(websocket.TextMessage, []byte(message))
		if err != nil {
			log.Println("[-] Error enviando al operador:", err)
			conn.Close()
			delete(ConsoleClients, conn)
		}
	}
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var ConnectedAgents = make(map[string]*models.Agent) // clave: UUID

func WSHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error en WebSocket upgrade:", err)
		return
	}

	// log.Println("[+] Conexión WebSocket establecida, esperando beacon...")

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

	agent.Conn = conn
	agent.Connected = true
	agent.LastSeen = time.Now().Format(time.RFC3339)

	ConnectedAgents[agent.UUID] = &agent

	// log.Printf("[+] Agente registrado: %s (%s / %s)\n", agent.Hostname, agent.IP, agent.OS)

	go handleAgent(&agent)
}

func handleAgent(agent *models.Agent) {
	defer func() {
		agent.Conn.Close()
		delete(ConnectedAgents, agent.UUID)
		// log.Printf("[-] Agente desconectado: %s (%s)\n", agent.Hostname, agent.UUID)
	}()

	for {
		_, msg, err := agent.Conn.ReadMessage()
		if err != nil {
			log.Println("[-] Error leyendo mensaje:", err)
			break
		}
		// log.Printf("[AGENTE %s] %s\n", agent.UUID, msg)

		// Reenviar a todos los operadores conectados
		broadcastToOperators(fmt.Sprintf(" %s", msg))
	}
}
