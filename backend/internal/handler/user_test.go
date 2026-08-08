package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/yuuya-1205/kurumo-web/backend/internal/model"
	"github.com/yuuya-1205/kurumo-web/backend/internal/store"
)

// newTestHandler はインメモリ DB につないだハンドラを返す。
// テストごとに独立した DB になる。
func newTestHandler(t *testing.T) *User {
	t.Helper()

	gdb, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{
		Logger:         logger.Default.LogMode(logger.Silent),
		TranslateError: true,
	})
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	if err := gdb.AutoMigrate(&model.User{}); err != nil {
		t.Fatalf("failed to migrate: %v", err)
	}

	return NewUser(store.NewUser(gdb))
}

// do はリクエストを 1 件実行して結果を返す。
func do(h *User, method, target, body string) *httptest.ResponseRecorder {
	var r *http.Request
	if body == "" {
		r = httptest.NewRequest(method, target, nil)
	} else {
		r = httptest.NewRequest(method, target, strings.NewReader(body))
	}

	// ServeMux を通さないと PathValue が埋まらないため、ここで組み立てる。
	mux := http.NewServeMux()
	mux.HandleFunc("GET /users", h.List)
	mux.HandleFunc("POST /users", h.Create)
	mux.HandleFunc("GET /users/{id}", h.Get)
	mux.HandleFunc("PUT /users/{id}", h.Update)
	mux.HandleFunc("DELETE /users/{id}", h.Delete)

	rec := httptest.NewRecorder()
	mux.ServeHTTP(rec, r)
	return rec
}

func TestUser_CRUD(t *testing.T) {
	h := newTestHandler(t)

	// 作成
	rec := do(h, http.MethodPost, "/users", `{"name":"田中","email":"tanaka@example.com"}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("create status = %d, want %d (body: %s)", rec.Code, http.StatusCreated, rec.Body)
	}

	var created model.User
	if err := json.NewDecoder(rec.Body).Decode(&created); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if created.ID == 0 {
		t.Fatal("created.ID = 0, want a generated id")
	}
	if created.Name != "田中" {
		t.Errorf("name = %q, want %q", created.Name, "田中")
	}

	// 取得
	rec = do(h, http.MethodGet, "/users/1", "")
	if rec.Code != http.StatusOK {
		t.Fatalf("get status = %d, want %d", rec.Code, http.StatusOK)
	}

	// 一覧
	rec = do(h, http.MethodGet, "/users", "")
	var list []model.User
	if err := json.NewDecoder(rec.Body).Decode(&list); err != nil {
		t.Fatalf("failed to decode list: %v", err)
	}
	if len(list) != 1 {
		t.Errorf("len(list) = %d, want 1", len(list))
	}

	// 更新
	rec = do(h, http.MethodPut, "/users/1", `{"name":"田中太郎","email":"tanaka@example.com"}`)
	if rec.Code != http.StatusOK {
		t.Fatalf("update status = %d, want %d (body: %s)", rec.Code, http.StatusOK, rec.Body)
	}
	var updated model.User
	_ = json.NewDecoder(rec.Body).Decode(&updated)
	if updated.Name != "田中太郎" {
		t.Errorf("name = %q, want %q", updated.Name, "田中太郎")
	}

	// 削除
	rec = do(h, http.MethodDelete, "/users/1", "")
	if rec.Code != http.StatusNoContent {
		t.Fatalf("delete status = %d, want %d", rec.Code, http.StatusNoContent)
	}

	// 削除後は 404
	rec = do(h, http.MethodGet, "/users/1", "")
	if rec.Code != http.StatusNotFound {
		t.Errorf("get after delete status = %d, want %d", rec.Code, http.StatusNotFound)
	}
}

func TestUser_EmailConflict(t *testing.T) {
	h := newTestHandler(t)

	body := `{"name":"田中","email":"tanaka@example.com"}`
	if rec := do(h, http.MethodPost, "/users", body); rec.Code != http.StatusCreated {
		t.Fatalf("first create status = %d, want %d", rec.Code, http.StatusCreated)
	}

	rec := do(h, http.MethodPost, "/users", body)
	if rec.Code != http.StatusConflict {
		t.Fatalf("duplicate create status = %d, want %d (body: %s)", rec.Code, http.StatusConflict, rec.Body)
	}
}

func TestUser_Validation(t *testing.T) {
	tests := []struct {
		name  string
		body  string
		field string
	}{
		{"name が空", `{"name":"","email":"a@example.com"}`, "name"},
		{"email が空", `{"name":"田中","email":""}`, "email"},
		{"email の形式が不正", `{"name":"田中","email":"not-an-email"}`, "email"},
		{"name が空白のみ", `{"name":"   ","email":"a@example.com"}`, "name"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := newTestHandler(t)

			rec := do(h, http.MethodPost, "/users", tt.body)
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want %d", rec.Code, http.StatusBadRequest)
			}

			var body ErrorBody
			if err := json.NewDecoder(rec.Body).Decode(&body); err != nil {
				t.Fatalf("failed to decode: %v", err)
			}
			if _, ok := body.Fields[tt.field]; !ok {
				t.Errorf("fields = %v, want a %q entry", body.Fields, tt.field)
			}
		})
	}
}

func TestUser_BadRequests(t *testing.T) {
	tests := []struct {
		name   string
		method string
		target string
		body   string
		want   int
	}{
		{"存在しない ID", http.MethodGet, "/users/999", "", http.StatusNotFound},
		{"ID が数値でない", http.MethodGet, "/users/abc", "", http.StatusBadRequest},
		{"ID が 0", http.MethodGet, "/users/0", "", http.StatusBadRequest},
		{"JSON が壊れている", http.MethodPost, "/users", `{"name":`, http.StatusBadRequest},
		{"未知のフィールド", http.MethodPost, "/users", `{"name":"ا","email":"a@example.com","admin":true}`, http.StatusBadRequest},
		{"存在しない ID の削除", http.MethodDelete, "/users/999", "", http.StatusNotFound},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := newTestHandler(t)

			rec := do(h, tt.method, tt.target, tt.body)
			if rec.Code != tt.want {
				t.Errorf("status = %d, want %d (body: %s)", rec.Code, tt.want, rec.Body)
			}
		})
	}
}
