package routes

import (
	"net/http"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

type PayloadRequest struct {
	Host string `json:"host"`
	Port string `json:"port"`
	Mode string `json:"mode"`
	OS   string `json:"os"`
	Arch string `json:"arch"`
}

func RegisterRoutes(r *gin.Engine) {
	r.POST("/generar", generarPayloadHandler)
}

func generarPayloadHandler(c *gin.Context) {
	var req PayloadRequest
	if err := c.BindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "JSON inválido"})
		return
	}

	extension := ""
	if req.OS == "windows" {
		extension = ".exe"
	}

	output := filepath.Join("bin", "payload_"+req.Mode+extension)

	// err := builder.BuildPayload(output, req.Host, req.Port, req.Mode, req.OS, req.Arch)
	// if err != nil {
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Error al compilar", "detalle": err.Error()})
	// 	return
	// }

	c.Header("Content-Disposition", "attachment; filename="+filepath.Base(output))
	c.Header("Content-Type", "application/octet-stream")
	c.File(output)
}
