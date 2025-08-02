package controllers

import (
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func ScreenshotHandler(c *gin.Context) {
	id := c.Query("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Falta parámetro 'id'"})
		return
	}

	data, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error leyendo el body"})
		return
	}

	err = os.MkdirAll("tmp", 0755)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando carpeta tmp"})
		return
	}

	filename := fmt.Sprintf("tmp/%s.png", id)
	err = os.WriteFile(filename, data, 0644)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error guardando imagen"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Screenshot guardado correctamente"})
}
