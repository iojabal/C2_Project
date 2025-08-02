package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

var clients = make(map[string]time.Time)

type PingRequest struct {
	ID string `json:"id"`
}

func PingHandler(c *gin.Context) {
	var req PingRequest

	if err := c.BindJSON(&req); err != nil || req.ID == "" {
		req.ID = c.ClientIP()
	}

	clients[req.ID] = time.Now()
	c.JSON(http.StatusOK, gin.H{"status": "pong"})
}

func GetActiveClients() []string {
	var active []string
	for id, last := range clients {
		if time.Since(last) < 3*time.Minute {
			active = append(active, id)
		}
	}
	return active
}
