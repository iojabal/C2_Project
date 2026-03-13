package models

import (
	"context"
	"proyecto_grado/db"
	"time"

	"github.com/gorilla/websocket"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type Agent struct {
	Conn      *websocket.Conn `bson:"-" json:"-"`
	UUID      string          `bson:"uuid"`
	IP        string          `bson:"ip"`
	Hostname  string          `bson:"hostname"`
	OS        string          `bson:"os"`
	LastSeen  string          `bson:"last_seen"`
	Connected bool            `bson:"connected"`
	Active    bool            `bson:"active"`
}

func (a *Agent) MarkDisconnected() error {
	// Actualizamos sólo los flags (no tocamos LastSeen)
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	filter := bson.M{"uuid": a.UUID}
	update := bson.M{"$set": bson.M{
		"connected": false,
		"active":    false,
	}}

	_, err := db.MongoClient.
		Database("proyecto_grado").
		Collection("agents").
		UpdateOne(ctx, filter, update)
	return err
}

func (a *Agent) Save() error {
	// 1) Contexto con timeout para la operación
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	col := db.MongoClient.
		Database("proyecto_grado").
		Collection("agents")

	// 2) Creamos filtro y documento de actualización
	filter := bson.M{"uuid": a.UUID}
	update := bson.M{"$set": bson.M{
		"ip":        a.IP,
		"hostname":  a.Hostname,
		"os":        a.OS,
		"last_seen": a.LastSeen,
		"connected": true, // Siempre marcamos conectado
		"active":    true, // Y activo
	}}

	// 3) Si existe, actualizamos; si no, insertamos (upsert)
	opts := options.Update().SetUpsert(true)
	_, err := col.UpdateOne(ctx, filter, update, opts)
	return err
}

func GetAllAgents() ([]*Agent, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	col := db.MongoClient.
		Database("proyecto_grado").
		Collection("agents")

	cursor, err := col.Find(ctx, bson.M{})
	if err != nil {
		return nil, err
	}
	defer cursor.Close(ctx)

	agents := make([]*Agent, 0)
	for cursor.Next(ctx) {
		var a Agent
		if err := cursor.Decode(&a); err != nil {
			return nil, err
		}
		agents = append(agents, &a)
	}
	if err := cursor.Err(); err != nil {
		return nil, err
	}
	return agents, nil
}
