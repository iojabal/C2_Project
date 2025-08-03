package controllers

import (
	"net/http"
	"proyecto_grado/models"

	"github.com/gin-gonic/gin"
)

// type AgentInfo struct {
// 	UUID      string `json:"uuid"`
// 	Hostname  string `json:"hostname"`
// 	OS        string `json:"os"`
// 	IP        string `json:"ip"`
// 	LastSeen  string `json:"last_seen"`
// 	Connected bool   `json:"connected"`
// 	Active    bool   `json:"active"`
// }

func ListAgents(c *gin.Context) {
	agents, err := models.GetAllAgents()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, agents)
}
