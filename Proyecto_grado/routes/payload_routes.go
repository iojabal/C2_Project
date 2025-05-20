package routes

import (
	"net/http"
	"path/filepath"
	"proyecto_grado/models"
	"proyecto_grado/services"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	r.POST("/generar", generarPayloadHandler)
}

func generarPayloadHandler(c *gin.Context) {
	var req models.PayloadRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	output, err := services.GeneratePayload(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error generando payload",
			"detalle": err.Error(),
		})
		return
	}

	c.Header("Content-Disposition", "attachment; filename="+filepath.Base(output))
	c.Header("Content-Type", "application/octet-stream")
	c.File(output)
}
