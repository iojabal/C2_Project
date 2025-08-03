// services/agent_service.go
package services

import (
	"context"
	"proyecto_grado/db"
	"proyecto_grado/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

type AgentService struct {
	database *mongo.Database
}

func NewAgentService() *AgentService {
	return &AgentService{
		database: db.MongoClient.Database("proyecto_grado"),
	}
}

func (s *AgentService) GetAgentByUUID(ctx context.Context, uuid string) (*models.Agent, error) {
	var agent models.Agent
	err := s.database.Collection("agents").FindOne(ctx, bson.M{"UUID": uuid}).Decode(&agent)
	if err != nil {
		return nil, err
	}
	return &agent, nil
}

func (s *AgentService) GetAgentByHostname(ctx context.Context, hostname string) (*models.Agent, error) {
	var agent models.Agent
	err := s.database.Collection("agents").FindOne(ctx, bson.M{"Hostname": hostname}).Decode(&agent)
	if err != nil {
		return nil, err
	}
	return &agent, nil
}

func (s *AuditService) GetReportById(ctx context.Context, reportId string) (*models.AuditReport, error) {
	objectID, err := primitive.ObjectIDFromHex(reportId)
	if err != nil {
		return nil, err
	}

	var report models.AuditReport
	err = s.database.Collection("audit_reports").FindOne(ctx, bson.M{"_id": objectID}).Decode(&report)
	if err != nil {
		return nil, err
	}

	return &report, nil
}
