package controllers

import (
	"net/http" // si está en el mismo paquete, omitir

	"github.com/gin-gonic/gin"
)

func SendCommand(c *gin.Context) {
	uuid := c.Param("uuid")
	cmd := c.Query("cmd") // o usar POST con JSON si prefieres

	agent, ok := ConnectedAgents[uuid]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "Agente no encontrado"})
		return
	}

	err := agent.Conn.WriteMessage(1, []byte(cmd)) // 1 = websocket.TextMessage
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error enviando comando"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "Comando enviado"})
}
