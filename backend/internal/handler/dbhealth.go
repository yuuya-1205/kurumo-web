package handler

import (
	"log/slog"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/yuuya-1205/kurumo-web/backend/internal/db"
)

// dbPingTimeout は疎通確認 1 回あたりの上限。
const dbPingTimeout = 3 * time.Second

type dbHealthResponse struct {
	Status   string `json:"status"`
	Database string `json:"database"`
	InUse    int    `json:"in_use"`
	Idle     int    `json:"idle"`
}

// DBHealth はデータベースへの疎通確認を行うハンドラを返す。
// 疎通できない場合は 503 を返すので、ロードバランサの readiness 判定に使える。
func DBHealth(gdb *gorm.DB, dbName string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if err := db.Ping(c.Request.Context(), gdb, dbPingTimeout); err != nil {
			// 接続情報が漏れないよう、詳細はログにのみ残す。
			slog.Error("database ping failed", "error", err)
			Error(c, http.StatusServiceUnavailable, "database unreachable")
			return
		}

		stats, err := db.Stats(gdb)
		if err != nil {
			internalError(c, "failed to read db stats", err)
			return
		}

		c.JSON(http.StatusOK, dbHealthResponse{
			Status:   "ok",
			Database: dbName,
			InUse:    stats.InUse,
			Idle:     stats.Idle,
		})
	}
}
