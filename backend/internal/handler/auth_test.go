package handler

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"github.com/yuuya-1205/kurumo-web/backend/internal/auth"
	"github.com/yuuya-1205/kurumo-web/backend/internal/model"
	"github.com/yuuya-1205/kurumo-web/backend/internal/store"
)

// testJWTSecret はテスト用の署名鍵。本番の鍵は環境変数から渡す。
const testJWTSecret = "test-secret"

// newTestAuth はインメモリ DB につないだ認証ハンドラを返す。
// テストごとに独立した DB になる。
func newTestAuth(t *testing.T) *Auth {
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

	return NewAuth(store.NewUser(gdb), auth.NewTokenizer(testJWTSecret, time.Hour))
}

// newAuthEngine は server.Route と同じ組み方でルーターを作る。
// middleware を含めた形で確かめたいので、ハンドラを直接呼ばずここを通す。
func newAuthEngine(h *Auth) *gin.Engine {
	gin.SetMode(gin.TestMode)
	engine := gin.New()
	// 未対応メソッドが 404 ではなく 405 になることも確かめるため、本番と同じく有効にする。
	engine.HandleMethodNotAllowed = true

	engine.POST("/auth/signup", h.Signup)
	engine.POST("/auth/login", h.Login)
	engine.GET("/auth/me", h.RequireAuth(), h.Me)
	engine.PATCH("/auth/me", h.RequireAuth(), h.UpdateMe)

	return engine
}

// doAuthHeader は Authorization ヘッダをそのまま指定してリクエストを 1 件実行する。
func doAuthHeader(h *Auth, method, target, body, header string) *httptest.ResponseRecorder {
	var r *http.Request
	if body == "" {
		r = httptest.NewRequest(method, target, nil)
	} else {
		r = httptest.NewRequest(method, target, strings.NewReader(body))
	}
	if header != "" {
		r.Header.Set("Authorization", header)
	}

	rec := httptest.NewRecorder()
	newAuthEngine(h).ServeHTTP(rec, r)
	return rec
}

// doAuth はリクエストを 1 件実行して結果を返す。token が空でなければ
// Authorization ヘッダを付ける。
func doAuth(h *Auth, method, target, body, token string) *httptest.ResponseRecorder {
	var header string
	if token != "" {
		header = "Bearer " + token
	}
	return doAuthHeader(h, method, target, body, header)
}

// authBody はレスポンスの token と user を取り出す。
func authBody(t *testing.T, rec *httptest.ResponseRecorder) (string, model.User) {
	t.Helper()

	var body struct {
		Token string     `json:"token"`
		User  model.User `json:"user"`
	}
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to decode: %v (body: %s)", err, rec.Body)
	}
	return body.Token, body.User
}

// signup はテストの前提となるユーザーを 1 件作り、トークンを返す。
func signup(t *testing.T, h *Auth, email, password string) string {
	t.Helper()

	rec := doAuth(h, http.MethodPost, "/auth/signup",
		`{"email":"`+email+`","password":"`+password+`"}`, "")
	if rec.Code != http.StatusCreated {
		t.Fatalf("signup status = %d, want %d (body: %s)", rec.Code, http.StatusCreated, rec.Body)
	}

	token, _ := authBody(t, rec)
	return token
}

func TestAuth_Signup(t *testing.T) {
	h := newTestAuth(t)

	rec := doAuth(h, http.MethodPost, "/auth/signup",
		`{"email":"tanaka@example.com","password":"password123"}`, "")
	if rec.Code != http.StatusCreated {
		t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusCreated, rec.Body)
	}

	token, user := authBody(t, rec)
	if token == "" {
		t.Error("token is empty, want a signed token")
	}
	if user.ID == 0 {
		t.Error("user.id = 0, want a generated id")
	}
	if user.Email != "tanaka@example.com" {
		t.Errorf("user.email = %q, want %q", user.Email, "tanaka@example.com")
	}
	// name は signup では受け取らず、あとから PATCH /auth/me で設定する。
	if user.Name != "" {
		t.Errorf("user.name = %q, want %q", user.Name, "")
	}
}

// TestAuth_ResponseHidesPasswordHash はレスポンスにパスワードのハッシュが
// 含まれないことを確かめる。model.User の json:"-" が外れたら落ちる。
func TestAuth_ResponseHidesPasswordHash(t *testing.T) {
	h := newTestAuth(t)

	const password = "password123"

	signupRec := doAuth(h, http.MethodPost, "/auth/signup",
		`{"email":"tanaka@example.com","password":"`+password+`"}`, "")
	token, _ := authBody(t, signupRec)

	loginRec := doAuth(h, http.MethodPost, "/auth/login",
		`{"email":"tanaka@example.com","password":"`+password+`"}`, "")
	meRec := doAuth(h, http.MethodGet, "/auth/me", "", token)

	targets := map[string]*httptest.ResponseRecorder{
		"signup": signupRec,
		"login":  loginRec,
		"me":     meRec,
	}

	for name, rec := range targets {
		t.Run(name, func(t *testing.T) {
			var raw map[string]json.RawMessage
			if err := json.Unmarshal(rec.Body.Bytes(), &raw); err != nil {
				t.Fatalf("failed to decode: %v (body: %s)", err, rec.Body)
			}

			var user map[string]json.RawMessage
			if err := json.Unmarshal(raw["user"], &user); err != nil {
				t.Fatalf("failed to decode user: %v", err)
			}

			for _, key := range []string{"password_hash", "PasswordHash", "password"} {
				if _, ok := user[key]; ok {
					t.Errorf("user has a %q key, want none", key)
				}
			}
			// ハッシュは "$2a$" で始まる。キー名に関係なく本文に出ていないことを見る。
			if strings.Contains(rec.Body.String(), "$2a$") {
				t.Errorf("body contains a bcrypt hash: %s", rec.Body)
			}
		})
	}
}

func TestAuth_SignupEmailConflict(t *testing.T) {
	h := newTestAuth(t)

	signup(t, h, "tanaka@example.com", "password123")

	rec := doAuth(h, http.MethodPost, "/auth/signup",
		`{"email":"tanaka@example.com","password":"password456"}`, "")
	if rec.Code != http.StatusConflict {
		t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusConflict, rec.Body)
	}

	var body ErrorBody
	if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to decode: %v", err)
	}
	if body.Error != "email already taken" {
		t.Errorf("error = %q, want %q", body.Error, "email already taken")
	}
}

func TestAuth_SignupValidation(t *testing.T) {
	// 72 バイトを超えるパスワード。bcrypt が見ない分を黙って捨てないことの確認。
	tooLong := strings.Repeat("a", 73)

	tests := []struct {
		name  string
		body  string
		field string
	}{
		{"password が短い", `{"email":"a@example.com","password":"short12"}`, "password"},
		{"password が空", `{"email":"a@example.com","password":""}`, "password"},
		{"password が 72 バイト超", `{"email":"a@example.com","password":"` + tooLong + `"}`, "password"},
		{"email が空", `{"email":"","password":"password123"}`, "email"},
		{"email の形式が不正", `{"email":"not-an-email","password":"password123"}`, "email"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := newTestAuth(t)

			rec := doAuth(h, http.MethodPost, "/auth/signup", tt.body, "")
			if rec.Code != http.StatusBadRequest {
				t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusBadRequest, rec.Body)
			}

			var body ErrorBody
			if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
				t.Fatalf("failed to decode: %v", err)
			}
			if _, ok := body.Fields[tt.field]; !ok {
				t.Errorf("fields = %v, want a %q entry", body.Fields, tt.field)
			}
		})
	}
}

func TestAuth_Login(t *testing.T) {
	h := newTestAuth(t)

	signup(t, h, "tanaka@example.com", "password123")

	rec := doAuth(h, http.MethodPost, "/auth/login",
		`{"email":"tanaka@example.com","password":"password123"}`, "")
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusOK, rec.Body)
	}

	token, user := authBody(t, rec)
	if token == "" {
		t.Error("token is empty, want a signed token")
	}
	if user.Email != "tanaka@example.com" {
		t.Errorf("user.email = %q, want %q", user.Email, "tanaka@example.com")
	}
}

// TestAuth_LoginFailure はログイン失敗が常に同じ 401 になることを確かめる。
// メールアドレスの有無で応答が変わるとアカウント列挙ができてしまう。
func TestAuth_LoginFailure(t *testing.T) {
	tests := []struct {
		name string
		body string
	}{
		{"パスワードが違う", `{"email":"tanaka@example.com","password":"wrongpassword"}`},
		{"メールアドレスが存在しない", `{"email":"unknown@example.com","password":"password123"}`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := newTestAuth(t)
			signup(t, h, "tanaka@example.com", "password123")

			rec := doAuth(h, http.MethodPost, "/auth/login", tt.body, "")
			if rec.Code != http.StatusUnauthorized {
				t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusUnauthorized, rec.Body)
			}

			var body ErrorBody
			if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
				t.Fatalf("failed to decode: %v", err)
			}
			if body.Error != "email or password is incorrect" {
				t.Errorf("error = %q, want %q", body.Error, "email or password is incorrect")
			}
		})
	}
}

func TestAuth_Me(t *testing.T) {
	h := newTestAuth(t)

	token := signup(t, h, "tanaka@example.com", "password123")

	rec := doAuth(h, http.MethodGet, "/auth/me", "", token)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusOK, rec.Body)
	}

	_, user := authBody(t, rec)
	if user.Email != "tanaka@example.com" {
		t.Errorf("user.email = %q, want %q", user.Email, "tanaka@example.com")
	}
}

func TestAuth_MeUnauthorized(t *testing.T) {
	// 期限切れのトークン。有効期限が過ぎたものが通らないことを確かめる。
	expired, err := auth.NewTokenizer(testJWTSecret, -time.Hour).Issue(1)
	if err != nil {
		t.Fatalf("failed to issue expired token: %v", err)
	}
	// 別の鍵で署名したトークン。署名の検証が効いていることを確かめる。
	otherSecret, err := auth.NewTokenizer("another-secret", time.Hour).Issue(1)
	if err != nil {
		t.Fatalf("failed to issue token: %v", err)
	}

	tests := []struct {
		name   string
		header string
	}{
		{"トークンが無い", ""},
		{"トークンが壊れている", "Bearer not-a-jwt"},
		{"署名鍵が違う", "Bearer " + otherSecret},
		{"期限切れ", "Bearer " + expired},
		{"スキームが Bearer でない", "Basic abcdef"},
		{"Bearer の後ろが空", "Bearer "},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := newTestAuth(t)
			signup(t, h, "tanaka@example.com", "password123")

			rec := doAuthHeader(h, http.MethodGet, "/auth/me", "", tt.header)
			if rec.Code != http.StatusUnauthorized {
				t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusUnauthorized, rec.Body)
			}

			var body ErrorBody
			if err := json.Unmarshal(rec.Body.Bytes(), &body); err != nil {
				t.Fatalf("failed to decode: %v", err)
			}
			if body.Error != "unauthorized" {
				t.Errorf("error = %q, want %q", body.Error, "unauthorized")
			}
		})
	}
}

func TestAuth_UpdateMe(t *testing.T) {
	h := newTestAuth(t)

	token := signup(t, h, "tanaka@example.com", "password123")

	rec := doAuth(h, http.MethodPatch, "/auth/me", `{"name":"田中太郎"}`, token)
	if rec.Code != http.StatusOK {
		t.Fatalf("status = %d, want %d (body: %s)", rec.Code, http.StatusOK, rec.Body)
	}

	_, user := authBody(t, rec)
	if user.Name != "田中太郎" {
		t.Errorf("user.name = %q, want %q", user.Name, "田中太郎")
	}

	// 更新後に取り直しても反映されている。
	rec = doAuth(h, http.MethodGet, "/auth/me", "", token)
	_, user = authBody(t, rec)
	if user.Name != "田中太郎" {
		t.Errorf("name after get = %q, want %q", user.Name, "田中太郎")
	}
}

func TestAuth_UpdateMeBadRequests(t *testing.T) {
	tests := []struct {
		name      string
		body      string
		withToken bool
		want      int
	}{
		{"トークンが無い", `{"name":"田中"}`, false, http.StatusUnauthorized},
		{"name が空", `{"name":""}`, true, http.StatusBadRequest},
		{"name が空白のみ", `{"name":"   "}`, true, http.StatusBadRequest},
		{"JSON が壊れている", `{"name":`, true, http.StatusBadRequest},
		{"未知のフィールド", `{"name":"田中","admin":true}`, true, http.StatusBadRequest},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := newTestAuth(t)
			token := signup(t, h, "tanaka@example.com", "password123")
			if !tt.withToken {
				token = ""
			}

			rec := doAuth(h, http.MethodPatch, "/auth/me", tt.body, token)
			if rec.Code != tt.want {
				t.Errorf("status = %d, want %d (body: %s)", rec.Code, tt.want, rec.Body)
			}
		})
	}
}

// TestAuth_MethodNotAllowed は Gin 移行後も未対応メソッドが 404 ではなく
// 405 になることを確かめる（engine.HandleMethodNotAllowed）。
//
// 405 の判定は Gin のルーターがルート個別の middleware より先に行うため、
// トークンの有無にかかわらず 405 になる。認証を掛けたルートでも
// RequireAuth より 405 が先に効く。
func TestAuth_MethodNotAllowed(t *testing.T) {
	tests := []struct {
		name      string
		withToken bool
	}{
		{"トークン無し", false},
		{"トークン有り", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := newTestAuth(t)
			token := signup(t, h, "tanaka@example.com", "password123")
			if !tt.withToken {
				token = ""
			}

			rec := doAuth(h, http.MethodDelete, "/auth/me", "", token)
			if rec.Code != http.StatusMethodNotAllowed {
				t.Errorf("status = %d, want %d (body: %s)",
					rec.Code, http.StatusMethodNotAllowed, rec.Body)
			}
		})
	}
}
