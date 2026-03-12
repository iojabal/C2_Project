package services

import (
	"context"
	"fmt"
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

// InsertImmutableReport inserta un log encadenando su hash con el del log anterior.
// Esto garantiza que cualquier modificación posterior sea matemáticamente detectable.
func (s *AuditService) InsertImmutableReport(ctx context.Context, report *models.AuditReport) error {
	col := s.database.Collection("audit_reports")

	// Buscar el último log para obtener su hash y secuencia
	var lastReport models.AuditReport
	opts := options.FindOne().SetSort(bson.D{{Key: "sequence", Value: -1}})
	err := col.FindOne(ctx, bson.M{}, opts).Decode(&lastReport)

	var prevHash string
	var nextSeq int64 = 1

	if err == nil {
		// Existe un log anterior: encadenar
		prevHash = lastReport.Hash
		nextSeq = lastReport.Sequence + 1
	} else if err != mongo.ErrNoDocuments {
		return err
	} else {
		// Primer log (genesis): prevHash fijo
		prevHash = "0000000000000000000000000000000000000000000000000000000000000000"
	}

	report.Sequence = nextSeq
	report.PrevHash = prevHash
	report.Hash = report.ComputeHash(prevHash)

	_, err = col.InsertOne(ctx, report)
	return err
}

// VerifyChain recorre todos los logs en orden y verifica que la cadena de hashes sea intacta.
func (s *AuditService) VerifyChain(ctx context.Context) (*models.ChainVerification, error) {
	opts := options.Find().SetSort(bson.D{{Key: "sequence", Value: 1}})
	cursor, err := s.database.Collection("audit_reports").Find(ctx, bson.M{}, opts)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	var reports []models.AuditReport
	if err = cursor.All(ctx, &reports); err != nil {
		return nil, err
	}

	total := len(reports)
	if total == 0 {
		return &models.ChainVerification{
			Valid:       true,
			TotalBlocks: 0,
			Message:     "No hay logs en la cadena",
		}, nil
	}

	expectedPrev := "0000000000000000000000000000000000000000000000000000000000000000"
	for _, r := range reports {
		// Verificar que el prevHash coincide con el hash del bloque anterior
		if r.PrevHash != expectedPrev {
			return &models.ChainVerification{
				Valid:       false,
				TotalBlocks: total,
				TamperedAt:  r.Sequence,
				Message:     fmt.Sprintf("Cadena rota en secuencia %d: prev_hash no coincide", r.Sequence),
			}, nil
		}
		// Recomputar el hash y comparar con el almacenado
		recomputed := r.ComputeHash(r.PrevHash)
		if recomputed != r.Hash {
			return &models.ChainVerification{
				Valid:       false,
				TotalBlocks: total,
				TamperedAt:  r.Sequence,
				Message:     fmt.Sprintf("Cadena rota en secuencia %d: hash no coincide (registro alterado)", r.Sequence),
			}, nil
		}
		expectedPrev = r.Hash
	}

	return &models.ChainVerification{
		Valid:       true,
		TotalBlocks: total,
		Message:     "Integridad de la cadena verificada correctamente",
	}, nil
}

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
				"lastseen": -1,
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
	filter := bson.M{"agentid": agentUUID}
	opts := options.Find().SetSort(bson.D{{Key: "lastseen", Value: -1}})

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

func (s *AuditService) GetAgentWithReports(ctx context.Context, agentUUID string) (*models.AgentWithReports, error) {
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
	opts := options.Find().SetSort(bson.D{{Key: "lastseen", Value: -1}})
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
