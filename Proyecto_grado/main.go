package main

import (
	"log"
	"proyecto_grado/db"
	"proyecto_grado/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	if err := db.Init("mongodb://localhost:27017"); err != nil {
		log.Fatalf("Error conectando a MongoDB: %v", err)
	}
	defer db.Close()

	r := gin.Default()
	r.Use(cors.Default())
	routes.RegisterRoutes(r)
	routes.RegisterWsRoutes(r)
	routes.RegisterScreenshotRoutes(r)
	routes.RegisterPingRoutes(r)
	routes.SetupAuditRoutes(r)

	r.Run(":5000") // Servidor en localhost:8080

}
