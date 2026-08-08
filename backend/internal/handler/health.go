package handler

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

type healthResponse struct {
	Status string    `json:"status"`
	Time   time.Time `json:"time"`
}

// Health はヘルスチェック用のハンドラを返す。
func Health() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.JSON(http.StatusOK, healthResponse{
			Status: "ok",
			Time:   time.Now().UTC(),
		})
	}
}
