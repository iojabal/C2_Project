package transport

import (
	"io"
	"log"

	"github.com/gorilla/websocket"
)

type WebSocketTransport struct {
	conn *websocket.Conn
	url  string
}

func NewWebSocket(url string) Transport {
	return &WebSocketTransport{url: url}
}

func (w *WebSocketTransport) Connect() error {
	c, _, err := websocket.DefaultDialer.Dial(w.url, nil)
	if err != nil {
		log.Println("[-] Error conectando WS:", err)
		return err
	}
	w.conn = c
	log.Println("[+] Conectado via WebSocket")
	return nil
}

func (w *WebSocketTransport) Read() ([]byte, error) {
	_, msg, err := w.conn.ReadMessage()
	if err != nil {
		return nil, err
	}
	return msg, nil
}

func (w *WebSocketTransport) Write(p []byte) error {
	return w.conn.WriteMessage(websocket.TextMessage, p)
}

func (w *WebSocketTransport) Close() error {
	return w.conn.Close()
}

func (w *WebSocketTransport) GetIO() io.ReadWriteCloser {
	return &websocketReadWriter{conn: w.conn}
}

type websocketReadWriter struct {
	conn *websocket.Conn
}

func (w *websocketReadWriter) Read(p []byte) (int, error) {
	_, msg, err := w.conn.ReadMessage()
	if err != nil {
		return 0, err
	}
	return copy(p, msg), nil
}

func (w *websocketReadWriter) Write(p []byte) (int, error) {
	err := w.conn.WriteMessage(websocket.TextMessage, p)
	if err != nil {
		return 0, err
	}
	return len(p), nil
}

func (w *websocketReadWriter) Close() error {
	return w.conn.Close()
}
