package server

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

// logging はリクエストのメソッド・パス・ステータス・所要時間を記録する。
// gin.Logger() は使わない。独自フォーマットで stdout に書くため、
// slog の JSON ログに揃わなくなる。
func logging() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		slog.Info("request",
			"method", c.Request.Method,
			"path", c.Request.URL.Path,
			"status", c.Writer.Status(),
			"duration", time.Since(start).String(),
		)
	}
}

// recovery はハンドラ内の panic を捕捉して 500 を返す。
// gin.Recovery() は使わない。スタックトレースを独自形式で stdout に
// 吐くのと、レスポンスが空ボディになり ErrorBody の形に揃わないため。
func recovery() gin.HandlerFunc {
	return func(c *gin.Context) {
		defer func() {
			if rec := recover(); rec != nil {
				slog.Error("panic recovered", "panic", rec, "path", c.Request.URL.Path)
				c.AbortWithStatusJSON(http.StatusInternalServerError,
					gin.H{"error": "internal server error"})
			}
		}()

		c.Next()
	}
}
