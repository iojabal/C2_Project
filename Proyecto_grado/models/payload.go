package models

type PayloadRequest struct {
	Host              string `json:"host"`
	Port              string `json:"port"`
	Mode              string `json:"mode"`
	OS                string `json:"os"`
	Arch              string `json:"arch"`
	EnablePersistence bool   `json:"enable_persistence"`
}
