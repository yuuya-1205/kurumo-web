package handler

import (
	"net/http"
	"time"
)

type healthResponse struct {
	Status string    `json:"status"`
	Time   time.Time `json:"time"`
}

// Health はヘルスチェック用のハンドラを返す。
func Health() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		JSON(w, http.StatusOK, healthResponse{
			Status: "ok",
			Time:   time.Now().UTC(),
		})
	}
}
