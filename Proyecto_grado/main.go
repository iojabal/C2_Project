package main

import (
	"proyecto_grado/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.Use(cors.Default())
	routes.RegisterRoutes(r)
	routes.RegisterWsRoutes(r)
	routes.RegisterScreenshotRoutes(r)
	routes.RegisterPingRoutes(r)

	r.Run(":5000") // Servidor en localhost:8080

}
