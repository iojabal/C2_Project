package controllers

import (
	"log"
	"net/http"
	"proyecto_grado/models"

	"github.com/gin-gonic/gin"
)

func AuditHandler(c *gin.Context) {
	var report models.AuditReport
	if err := c.ShouldBindJSON(&report); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report format"})
		return
	}
	// raw, err := json.Marshal(report)
	// if err != nil {
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process report"})
	// 	return
	// }

	// log.Printf("[+] Received audit report from agent %s", string(raw))
	if err := report.InsertAuditReport(); err != nil {
		log.Printf("[-] Error saving audit report: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save audit report"})
		return
	}
	c.String(http.StatusOK, "Audit report received successfully")
	// if err := SaveAuditReport(report); err != nil {}
}
