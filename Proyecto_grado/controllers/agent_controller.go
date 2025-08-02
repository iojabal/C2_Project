package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListAgents(c *gin.Context) {
	list := []gin.H{}
	for _, a := range ConnectedAgents {
		list = append(list, gin.H{
			"uuid":     a.UUID,
			"hostname": a.Hostname,
			"os":       a.OS,
			"ip":       a.IP,
			"seen":     a.LastSeen,
		})
	}
	c.JSON(http.StatusOK, list)
}
