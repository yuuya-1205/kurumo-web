package server

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yuuya-1205/kurumo-web/backend/internal/auth"
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

	Route(engine, gdb, cfg.DB.Name, auth.NewTokenizer(cfg.JWT.Secret, cfg.JWT.Expiry))

	return &http.Server{
		Addr:         ":" + cfg.Port,
		Handler:      engine,
		ReadTimeout:  cfg.ReadTimeout,
		WriteTimeout: cfg.WriteTimeout,
	}
}

// Route はエンドポイントを登録する。テストからも使えるよう分離している。
//
// Tokenizer は config ではなく組み立て済みのものを受け取る。テストから
// 有効期限の短い鍵などを差し替えられるようにするため。
func Route(engine *gin.Engine, gdb *gorm.DB, dbName string, tokens *auth.Tokenizer) {
	userStore := store.NewUser(gdb)
	users := handler.NewUser(userStore)
	auths := handler.NewAuth(userStore, tokens)

	engine.GET("/healthz", handler.Health())
	engine.GET("/healthz/db", handler.DBHealth(gdb, dbName))

	engine.GET("/users", users.List)
	engine.POST("/users", users.Create)
	engine.GET("/users/:id", users.Get)
	engine.PUT("/users/:id", users.Update)
	engine.DELETE("/users/:id", users.Delete)

	engine.POST("/auth/signup", auths.Signup)
	engine.POST("/auth/login", auths.Login)
	// 認証は全体には掛けず、本人の情報を扱うルートにだけ掛ける。
	// users と同じ粒度に揃えて、グループではなくルート個別に渡している。
	engine.GET("/auth/me", auths.RequireAuth(), auths.Me)
	engine.PATCH("/auth/me", auths.RequireAuth(), auths.UpdateMe)
}
