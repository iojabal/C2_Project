package persistence

type PersistenceStrategy interface {
	Setup() error
}
