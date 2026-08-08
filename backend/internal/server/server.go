package server

import (
	"net/http"

	"gorm.io/gorm"

	"github.com/yuuya-1205/kurumo-web/backend/internal/config"
	"github.com/yuuya-1205/kurumo-web/backend/internal/handler"
	"github.com/yuuya-1205/kurumo-web/backend/internal/store"
)

// New はルーティングと middleware を組み立てた http.Server を返す。
func New(cfg config.Config, gdb *gorm.DB) *http.Server {
	users := handler.NewUser(store.NewUser(gdb))

	mux := http.NewServeMux()
	mux.Handle("GET /healthz", handler.Health())
	mux.Handle("GET /healthz/db", handler.DBHealth(gdb, cfg.DB.Name))

	mux.HandleFunc("GET /users", users.List)
	mux.HandleFunc("POST /users", users.Create)
	mux.HandleFunc("GET /users/{id}", users.Get)
	mux.HandleFunc("PUT /users/{id}", users.Update)
	mux.HandleFunc("DELETE /users/{id}", users.Delete)

	return &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      chain(mux, recovery, logging),
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
	}
}
