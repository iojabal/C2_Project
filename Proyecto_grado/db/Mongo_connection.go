package db

import (
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var (
	MongoClient *mongo.Client
	mongoCtx    context.Context
	CancelFunc  context.CancelFunc
)

func Init(uri string) error {
	var err error
	mongoCtx, CancelFunc = context.WithTimeout(context.Background(), 10*time.Second)
	MongoClient, err = mongo.Connect(mongoCtx, options.Client().ApplyURI(uri))
	if err != nil {
		return err
	}
	if err = MongoClient.Ping(mongoCtx, nil); err != nil {
		return err
	}
	log.Println("[+] Conexión a MongoDB establecida")
	return nil
}

func Close() error {
	if CancelFunc != nil {
		CancelFunc()
	}
	return MongoClient.Disconnect(context.Background())
}
