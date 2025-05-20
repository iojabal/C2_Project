package transport

import (
	"io"
	"net"
)

type TCPTransport struct {
	conn net.Conn
	addr string
}

func NewTCP(addr string) *TCPTransport {
	return &TCPTransport{addr: addr}
}

func (t *TCPTransport) Connect() error {
	conn, err := net.Dial("tcp", t.addr)
	if err != nil {
		return err
	}
	t.conn = conn
	return nil
}

func (t *TCPTransport) Read() ([]byte, error) {
	buf := make([]byte, 1024)
	n, err := t.conn.Read(buf)
	return buf[:n], err
}

func (t *TCPTransport) Write(b []byte) error {
	_, err := t.conn.Write(b)
	return err
}

func (t *TCPTransport) GetIO() io.ReadWriteCloser {
	return t.conn
}

func (t *TCPTransport) Close() error {
	return t.conn.Close()
}
