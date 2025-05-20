package transport

import "io"

type Transport interface {
	Connect() error
	Read() ([]byte, error)
	Write([]byte) error
	Close() error
	GetIO() io.ReadWriteCloser
}
