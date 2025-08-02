package models

import (
	"github.com/gorilla/websocket"
)

type Agent struct {
	Conn *websocket.Conn

	// Información útil que puedes pedirle al agente
	IP        string
	Hostname  string
	OS        string
	LastSeen  string
	UUID      string
	Connected bool
	Active    bool
}
