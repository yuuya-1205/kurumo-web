package server

import (
	"database/sql"
	"net/http"

	"github.com/yuuya-1205/kurumo-web/backend/internal/config"
	"github.com/yuuya-1205/kurumo-web/backend/internal/handler"
)

// New はルーティングと middleware を組み立てた http.Server を返す。
func New(cfg config.Config, pool *sql.DB) *http.Server {
	mux := http.NewServeMux()
	mux.Handle("GET /healthz", handler.Health())
	mux.Handle("GET /healthz/db", handler.DBHealth(pool, cfg.DB.Name))

	return &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      chain(mux, recovery, logging),
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
	}
}
