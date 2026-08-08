package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/yuuya-1205/kurumo-web/backend/internal/config"
	"github.com/yuuya-1205/kurumo-web/backend/internal/db"
)

// 到達できない DB に対しては 503 を返し、200 を返してしまわないことを確認する。
func TestDBHealth_Unreachable(t *testing.T) {
	pool, err := db.Open(config.DBConfig{
		Host:         "127.0.0.1",
		Port:         "1", // 何も listen していないポート
		User:         "nobody",
		Name:         "nonexistent",
		MaxOpenConns: 1,
		MaxIdleConns: 1,
	})
	if err != nil {
		t.Fatalf("failed to open pool: %v", err)
	}
	defer pool.Close()

	req := httptest.NewRequest(http.MethodGet, "/healthz/db", nil)
	rec := httptest.NewRecorder()

	DBHealth(pool, "nonexistent").ServeHTTP(rec, req)

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
