package transport

import (
	"net"
)

type UDPTransport struct {
	conn *net.UDPConn
	addr *net.UDPAddr
}

func NewUDP(remote string) *UDPTransport {
	raddr, _ := net.ResolveUDPAddr("udp", remote)
	return &UDPTransport{addr: raddr}
}

func (u *UDPTransport) Connect() error {
	conn, err := net.DialUDP("udp", nil, u.addr)
	if err != nil {
		return err
	}
	u.conn = conn
	return nil
}

func (u *UDPTransport) Read() ([]byte, error) {
	buf := make([]byte, 1024)
	n, _, err := u.conn.ReadFromUDP(buf)
	return buf[:n], err
}

func (u *UDPTransport) Write(data []byte) error {
	_, err := u.conn.Write(data)
	return err
}

func (u *UDPTransport) Close() error {
	return u.conn.Close()
}

func (u *UDPTransport) GetIO() net.Conn {
	return nil // UDP no soporta shell interactiva
}
