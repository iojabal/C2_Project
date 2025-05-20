package main

import (
	"proyecto_grado/routes"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	routes.RegisterRoutes(r)

	r.Run(":5000") // Servidor en localhost:8080

}
