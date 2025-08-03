package routes

import (
	"proyecto_grado/controllers"

	"github.com/gin-gonic/gin"
)

func RegisterWsRoutes(r *gin.Engine) {
	r.GET("/ws", func(c *gin.Context) {
		controllers.WSHandler(c.Writer, c.Request)
	})
	r.GET("/ws/command/:uuid", controllers.SendCommand)
	r.GET("/ws/agents", func(ctx *gin.Context) {
		controllers.AgentsWSHandler(ctx.Writer, ctx.Request)
	})
	r.GET("/agents", controllers.ListAgents)
	r.GET("/ws/console", controllers.WSConsoleHandler)
	r.POST("/api/console/active-agent", controllers.SetActiveAgent)
}
