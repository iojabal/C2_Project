// services/audit_service.go - Actualizar todas las funciones
package services

import (
	"context"
	"proyecto_grado/db"
	"proyecto_grado/models"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type AuditService struct {
	database *mongo.Database
}

func NewAuditService() *AuditService {
	return &AuditService{
		database: db.MongoClient.Database("proyecto_grado"),
	}
}

// services/audit_service.go - Corregir GetAgentsWithReports
func (s *AuditService) GetAgentsWithReports(ctx context.Context) ([]models.AgentWithReports, error) {
	pipeline := []bson.M{
		{
			"$lookup": bson.M{
				"from": "audit_reports",
				"let":  bson.M{"agentUUID": "$uuid"},
				"pipeline": []bson.M{
					{
						"$match": bson.M{
							"$expr": bson.M{
								"$eq": []interface{}{
									"$agentid",
									"$$agentUUID",
								},
							},
						},
					},
				},
				"as": "reports",
			},
		},
		{
			"$addFields": bson.M{
				"reportCount": bson.M{"$size": "$reports"},
				"lastReport": bson.M{
					"$cond": bson.M{
						"if":   bson.M{"$gt": []interface{}{bson.M{"$size": "$reports"}, 0}},
						"then": bson.M{"$max": "$reports.lastseen"},
						"else": "",
					},
				},
			},
		},
		{
			"$sort": bson.M{
				"LlstSeen": -1,
			},
		},
	}

	cursor, err := s.database.Collection("agents").Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var result []models.AgentWithReports
	if err = cursor.All(ctx, &result); err != nil {
		return nil, err
	}

	return result, nil
}

func (s *AuditService) GetAgentReports(ctx context.Context, agentUUID string) ([]models.AuditReport, error) {
	// CAMBIO: Buscar por agentid en lugar de uuid
	filter := bson.M{"agentid": agentUUID}
	opts := options.Find().SetSort(bson.D{{"lastseen", -1}})

	cursor, err := s.database.Collection("audit_reports").Find(ctx, filter, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var reports []models.AuditReport
	if err = cursor.All(ctx, &reports); err != nil {
		return nil, err
	}

	return reports, nil
}

// services/audit_service.go - Actualizar GetAgentWithReports para ser más flexible
func (s *AuditService) GetAgentWithReports(ctx context.Context, agentUUID string) (*models.AgentWithReports, error) {
	// Intentar búsqueda exacta primero
	pipeline := []bson.M{
		{
			"$match": bson.M{"UUID": agentUUID},
		},
		{
			"$lookup": bson.M{
				"from":         "audit_reports",
				"localField":   "UUID",
				"foreignField": "agentid",
				"as":           "reports",
			},
		},
		{
			"$addFields": bson.M{
				"reportCount": bson.M{"$size": "$reports"},
				"lastReport": bson.M{
					"$cond": bson.M{
						"if":   bson.M{"$gt": []interface{}{bson.M{"$size": "$reports"}, 0}},
						"then": bson.M{"$max": "$reports.lastseen"},
						"else": "",
					},
				},
			},
		},
	}

	cursor, err := s.database.Collection("agents").Aggregate(ctx, pipeline)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var result []models.AgentWithReports
	if err = cursor.All(ctx, &result); err != nil {
		return nil, err
	}

	if len(result) == 0 {
		// Si no encuentra por UUID exacto, intentar búsqueda case-insensitive
		pipeline[0] = bson.M{
			"$match": bson.M{
				"UUID": bson.M{
					"$regex":   "^" + agentUUID + "$",
					"$options": "i",
				},
			},
		}

		cursor2, err := s.database.Collection("agents").Aggregate(ctx, pipeline)
		if err != nil {
			return nil, err
		}
		defer cursor2.Close(ctx)

		if err = cursor2.All(ctx, &result); err != nil {
			return nil, err
		}
	}

	if len(result) == 0 {
		return nil, mongo.ErrNoDocuments
	}

	return &result[0], nil
}

func (s *AuditService) GetAllReports(ctx context.Context) ([]models.AuditReport, error) {
	opts := options.Find().SetSort(bson.D{{"lastseen", -1}})
	cursor, err := s.database.Collection("audit_reports").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var reports []models.AuditReport
	if err = cursor.All(ctx, &reports); err != nil {
		return nil, err
	}

	return reports, nil
}
