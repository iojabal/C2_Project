package routes

import (
	"proyecto_grado/controllers"

	"github.com/gin-gonic/gin"
)

func SetupAuditRoutes(router *gin.Engine) {
	auditController := controllers.NewAuditController()

	// Grupo de rutas para auditorías
	v1 := router.Group("/api/v1")
	{
		// Agentes con reportes
		v1.GET("/agents-with-reports", auditController.GetAgentsWithReports)
		v1.GET("/agents/:uuid/reports", auditController.GetAgentReports)
		v1.GET("/agents/:uuid/with-reports", auditController.GetAgentWithReports)
		// /reports/verify debe ir ANTES de /reports/:id para evitar conflicto de parámetros
		v1.GET("/reports/verify", auditController.VerifyChain)
		v1.GET("/reports/:id", auditController.GetReportById)

		// Reportes generales
		v1.GET("/reports", auditController.GetAllReports)
	}
	router.POST("/audit", controllers.AuditHandler)
}
