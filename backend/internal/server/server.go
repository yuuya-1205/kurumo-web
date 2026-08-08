package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yuuya-1205/kurumo-web/backend/internal/config"
	"github.com/yuuya-1205/kurumo-web/backend/internal/handler"
	"github.com/yuuya-1205/kurumo-web/backend/internal/store"
)

// New はルーティングと middleware を組み立てた http.Server を返す。
func New(cfg config.Config, gdb *gorm.DB) *http.Server {
	// gin の debug ログ（ルート一覧の出力など）を止め、ログを slog に一本化する。
	gin.SetMode(gin.ReleaseMode)

	engine := gin.New()
	// 存在するパスへの未対応メソッドには 404 ではなく 405 を返す
	// （ServeMux 時代の挙動を維持する）。
	engine.HandleMethodNotAllowed = true
	engine.Use(recovery(), logging())

	Route(engine, gdb, cfg.DB.Name)

	return &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      engine,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
	}
}

// Route はエンドポイントを登録する。テストからも使えるよう分離している。
func Route(engine *gin.Engine, gdb *gorm.DB, dbName string) {
	users := handler.NewUser(store.NewUser(gdb))

	engine.GET("/healthz", handler.Health())
	engine.GET("/healthz/db", handler.DBHealth(gdb, dbName))

	engine.GET("/users", users.List)
	engine.POST("/users", users.Create)
	engine.GET("/users/:id", users.Get)
	engine.PUT("/users/:id", users.Update)
	engine.DELETE("/users/:id", users.Delete)
}
