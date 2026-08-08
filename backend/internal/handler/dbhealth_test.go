package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"

	"github.com/yuuya-1205/kurumo-web/backend/internal/config"
	"github.com/yuuya-1205/kurumo-web/backend/internal/db"
)

// 到達できない DB に対しては 503 を返し、200 を返してしまわないことを確認する。
func TestDBHealth_Unreachable(t *testing.T) {
	gdb, err := db.Open(config.DBConfig{
		Host:         "127.0.0.1",
		Port:         "1", // 何も listen していないポート
		User:         "nobody",
		Name:         "nonexistent",
		LogLevel:     "silent",
		MaxOpenConns: 1,
		MaxIdleConns: 1,
	})
	if err != nil {
		// gorm.Open は接続を試みるため、ここで失敗する場合もある。
		// どちらにせよ「到達できない」ことは示せているのでスキップする。
		t.Skipf("could not build pool (expected for unreachable host): %v", err)
	}
	defer db.Close(gdb)

	gin.SetMode(gin.TestMode)
	engine := gin.New()
	engine.GET("/healthz/db", DBHealth(gdb, "nonexistent"))

	req := httptest.NewRequest(http.MethodGet, "/healthz/db", nil)
	rec := httptest.NewRecorder()

	engine.ServeHTTP(rec, req)

	if rec.Code != http.StatusServiceUnavailable {
		t.Fatalf("status = %d, want %d", rec.Code, http.StatusServiceUnavailable)
	}

	var body ErrorBody
	if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
		t.Fatalf("failed to decode body: %v", err)
	}
	if body.Error != "database unreachable" {
		t.Errorf("error = %q, want %q", body.Error, "database unreachable")
	}
}
