package transport

import (
	"bytes"
	"io"
	"net/http"
)

type HTTPTransport struct {
	server string
	client *http.Client
}

func NewHTTP(server string) *HTTPTransport {
	return &HTTPTransport{
		server: server,
		client: &http.Client{},
	}
}

func (h *HTTPTransport) Connect() error {
	return nil
}

func (h *HTTPTransport) Read() ([]byte, error) {
	resp, err := h.client.Get(h.server + "/command")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

func (h *HTTPTransport) Write(data []byte) error {
	_, err := h.client.Post(h.server+"/result", "application/octet-strema", bytes.NewReader(data))
	return err
}

func (h *HTTPTransport) Close() error {
    return nil
}

func (h *HTTPTransport) GetIO() io.ReadWriteCloser {
    return nil // HTTP no es interactivo
}