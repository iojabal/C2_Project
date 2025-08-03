package controllers

import (
	"log"
	"net/http"
	"proyecto_grado/models"
	"proyecto_grado/services"

	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
)

type AuditController struct {
	auditService *services.AuditService
}

func NewAuditController() *AuditController {
	return &AuditController{
		auditService: services.NewAuditService(),
	}
}

// Tu función existente - CONSERVADA
func AuditHandler(c *gin.Context) {
	var report models.AuditReport
	if err := c.ShouldBindJSON(&report); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid report format"})
		return
	}
	if err := report.InsertAuditReport(); err != nil {
		log.Printf("[-] Error saving audit report: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save audit report"})
		return
	}
	c.String(http.StatusOK, "Audit report received successfully")
	// if err := SaveAuditReport(report); err != nil {}
}

// Nuevas funciones usando el service
func (c *AuditController) GetAgentsWithReports(ctx *gin.Context) {
	agents, err := c.auditService.GetAgentsWithReports(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error al obtener agentes con reportes",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    agents,
		"count":   len(agents),
	})
}

func (c *AuditController) GetAgentReports(ctx *gin.Context) {
	agentUUID := ctx.Param("uuid") // Cambiar de "id" a "uuid"

	reports, err := c.auditService.GetAgentReports(ctx.Request.Context(), agentUUID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error al obtener reportes del agente",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    reports,
		"count":   len(reports),
	})
}

func (c *AuditController) GetAgentWithReports(ctx *gin.Context) {
	agentUUID := ctx.Param("uuid") // Cambiar de "id" a "uuid"

	agent, err := c.auditService.GetAgentWithReports(ctx.Request.Context(), agentUUID)
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error al obtener agente con reportes",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    agent,
	})
}

func (c *AuditController) GetAllReports(ctx *gin.Context) {
	reports, err := c.auditService.GetAllReports(ctx.Request.Context())
	if err != nil {
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error al obtener reportes",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    reports,
		"count":   len(reports),
	})
}

func (c *AuditController) GetReportById(ctx *gin.Context) {
	reportId := ctx.Param("id")

	report, err := c.auditService.GetReportById(ctx.Request.Context(), reportId)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			ctx.JSON(http.StatusNotFound, gin.H{
				"error": "Reporte no encontrado",
				"id":    reportId,
			})
			return
		}
		ctx.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Error al obtener el reporte",
			"details": err.Error(),
		})
		return
	}

	ctx.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    report,
	})
}
