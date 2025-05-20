package services

import (
	"fmt"
	"path/filepath"
	"proyecto_grado/builder"
	"proyecto_grado/models"
)

func GeneratePayloadFilename(req *models.PayloadRequest) string {
	ext := ""
	if req.OS == "windows" {
		ext = ".exe"
	}
	return filepath.Join("../bin", "payload_"+req.Mode+ext)
}

func GeneratePayload(req *models.PayloadRequest) (string, error) {
	output := GeneratePayloadFilename(req)
	err := builder.BuildPayload(
		output,
		req.OS,
		req.Arch,
		req.Host,
		req.Port,
		req.Mode,
		req.EnablePersistence,
	)
	if err != nil {
		return "", fmt.Errorf("error al generar el payload: %v", err)
	}
	return output, nil
}
