package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/yuuya-1205/kurumo-web/backend/internal/auth"
	"github.com/yuuya-1205/kurumo-web/backend/internal/model"
	"github.com/yuuya-1205/kurumo-web/backend/internal/store"
)

// credentialsRequest は signup / login のリクエスト。
//
// user.go の userRequest と同じ理由で ShouldBindJSON は使わない。未知の
// フィールドを黙って無視するのと、TrimSpace 後の検証や「全フィールド分の
// エラーを返す」形が binding タグでは表現できないため。decodeCredentials で自前に読む。
type credentialsRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// profileRequest は PATCH /auth/me のリクエスト。
type profileRequest struct {
	Name string `json:"name"`
}

// authResponse は signup / login のレスポンス。
type authResponse struct {
	Token string      `json:"token"`
	User  *model.User `json:"user"`
}

// meResponse は /auth/me のレスポンス。
type meResponse struct {
	User *model.User `json:"user"`
}

// invalidCredentialsMessage はログイン失敗時のメッセージ。
//
// 「メールアドレスが存在しない」と「パスワードが違う」で文言を変えない。
// 変えると、登録済みのメールアドレスを総当たりで割り出せてしまう（アカウント列挙）。
const invalidCredentialsMessage = "email or password is incorrect"

// dummyPasswordHash は存在しないメールアドレスに対して照合を空打ちするためのハッシュ。
//
// 未登録のメールアドレスだけ bcrypt を通らずに即座に 401 が返ると、応答時間の差から
// アカウントの有無が分かってしまう。それを避けるために同じだけ計算する。
// 値は "dummy password for timing" の bcrypt ハッシュで、どのアカウントにも対応しない。
const dummyPasswordHash = "$2a$10$K7ApTXZeQe9bh7qbgVUl7epdK4cAn4MHJn.5F0rrQJo5FckN37hZK"

// userIDKey は gin.Context に認証済みユーザー ID を載せるためのキー。
//
// context.WithValue ではなく c.Set / c.Get を使う。Gin が用意している
// リクエストスコープの受け渡しがこれで、middleware 側で c.Request を
// 差し替えずに済むため。キーは打ち間違いを防ぐために定数にしている。
const userIDKey = "userID"

// Auth は認証まわりのハンドラをまとめる。
type Auth struct {
	store  *store.User
	tokens *auth.Tokenizer
}

// NewAuth は Auth を生成する。
func NewAuth(s *store.User, t *auth.Tokenizer) *Auth {
	return &Auth{store: s, tokens: t}
}

// RequireAuth は Authorization: Bearer <token> を検証し、ユーザー ID を
// gin.Context に載せて次のハンドラへ渡す middleware。
//
// server/middleware.go の logging() / recovery() と同じく gin.HandlerFunc を返す形。
// 全体には掛けず、保護したいルートにだけ掛ける。
// トークンが無い・壊れている・期限切れのいずれも、区別せず 401 unauthorized を返す。
func (h *Auth) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		token, ok := bearerToken(c.GetHeader("Authorization"))
		if !ok {
			abortUnauthorized(c)
			return
		}

		id, err := h.tokens.Parse(token)
		if err != nil {
			abortUnauthorized(c)
			return
		}

		c.Set(userIDKey, id)
		c.Next()
	}
}

// abortUnauthorized は 401 を書いて後続のハンドラを止める。
// c.Abort を忘れるとハンドラ本体が動いてしまうため、middleware からはこれを使う。
func abortUnauthorized(c *gin.Context) {
	c.AbortWithStatusJSON(http.StatusUnauthorized, ErrorBody{Error: "unauthorized"})
}

// userIDFrom は gin.Context から認証済みのユーザー ID を取り出す。
// RequireAuth を通っていれば必ず取れる。
func userIDFrom(c *gin.Context) (uint64, bool) {
	v, exists := c.Get(userIDKey)
	if !exists {
		return 0, false
	}
	id, ok := v.(uint64)
	return id, ok
}

// Signup は POST /auth/signup。
//
// この時点では name を受け取らない。frontend の登録フローが
// 「メール + パスワード」→「プロフィール入力」の 2 段階になっているため、
// Name は空文字で作成し、あとから PATCH /auth/me で設定する。
func (h *Auth) Signup(c *gin.Context) {
	req, ok := decodeCredentials(c)
	if !ok {
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		internalError(c, "failed to hash password", err)
		return
	}

	user := &model.User{Name: "", Email: req.Email, PasswordHash: hash}
	if err := h.store.Create(c.Request.Context(), user); err != nil {
		if errors.Is(err, store.ErrEmailTaken) {
			Error(c, http.StatusConflict, "email already taken")
			return
		}
		internalError(c, "failed to create user", err)
		return
	}

	token, err := h.tokens.Issue(user.ID)
	if err != nil {
		internalError(c, "failed to issue token", err)
		return
	}

	c.JSON(http.StatusCreated, authResponse{Token: token, User: user})
}

// Login は POST /auth/login。
func (h *Auth) Login(c *gin.Context) {
	req, ok := decodeCredentials(c)
	if !ok {
		return
	}

	user, err := h.store.GetByEmail(c.Request.Context(), req.Email)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			// 応答時間を揃えるための空打ち。結果は使わない。
			auth.VerifyPassword(dummyPasswordHash, req.Password)
			Error(c, http.StatusUnauthorized, invalidCredentialsMessage)
			return
		}
		internalError(c, "failed to get user by email", err)
		return
	}

	if !auth.VerifyPassword(user.PasswordHash, req.Password) {
		Error(c, http.StatusUnauthorized, invalidCredentialsMessage)
		return
	}

	token, err := h.tokens.Issue(user.ID)
	if err != nil {
		internalError(c, "failed to issue token", err)
		return
	}

	c.JSON(http.StatusOK, authResponse{Token: token, User: user})
}

// Me は GET /auth/me。RequireAuth を通っている前提。
func (h *Auth) Me(c *gin.Context) {
	user, ok := h.currentUser(c)
	if !ok {
		return
	}
	c.JSON(http.StatusOK, meResponse{User: user})
}

// UpdateMe は PATCH /auth/me。name だけを更新する。RequireAuth を通っている前提。
func (h *Auth) UpdateMe(c *gin.Context) {
	id, ok := userIDFrom(c)
	if !ok {
		Error(c, http.StatusUnauthorized, "unauthorized")
		return
	}

	var req profileRequest

	dec := json.NewDecoder(c.Request.Body)
	dec.DisallowUnknownFields() // 綴り間違いを黙って無視しない
	if err := dec.Decode(&req); err != nil {
		Error(c, http.StatusBadRequest, "invalid JSON body")
		return
	}

	req.Name = strings.TrimSpace(req.Name)

	if reason := validateName(req.Name); reason != "" {
		ValidationError(c, map[string]string{"name": reason})
		return
	}

	user, err := h.store.UpdateName(c.Request.Context(), id, req.Name)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			// トークンは正しいが、対象のユーザーが既に消えている場合。
			Error(c, http.StatusUnauthorized, "unauthorized")
			return
		}
		internalError(c, "failed to update user name", err)
		return
	}

	c.JSON(http.StatusOK, meResponse{User: user})
}

// currentUser は gin.Context のユーザー ID から本人のレコードを引く。
// 取得できない場合は 401 を書いて false を返す。
func (h *Auth) currentUser(c *gin.Context) (*model.User, bool) {
	id, ok := userIDFrom(c)
	if !ok {
		Error(c, http.StatusUnauthorized, "unauthorized")
		return nil, false
	}

	user, err := h.store.Get(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, store.ErrNotFound) {
			// トークンは正しいが、対象のユーザーが既に消えている場合。
			Error(c, http.StatusUnauthorized, "unauthorized")
			return nil, false
		}
		internalError(c, "failed to get current user", err)
		return nil, false
	}
	return user, true
}

// bearerToken は Authorization ヘッダから Bearer トークンを取り出す。
// スキーム名の大文字小文字は問わない（RFC 7235 で case-insensitive のため）。
func bearerToken(header string) (string, bool) {
	scheme, token, found := strings.Cut(header, " ")
	if !found || !strings.EqualFold(scheme, "Bearer") {
		return "", false
	}

	token = strings.TrimSpace(token)
	if token == "" {
		return "", false
	}
	return token, true
}

// decodeCredentials は signup / login のボディを読んで検証する。
// 不正な場合は 400 を書いて false を返す。
func decodeCredentials(c *gin.Context) (credentialsRequest, bool) {
	var req credentialsRequest

	dec := json.NewDecoder(c.Request.Body)
	dec.DisallowUnknownFields() // 綴り間違いを黙って無視しない
	if err := dec.Decode(&req); err != nil {
		Error(c, http.StatusBadRequest, "invalid JSON body")
		return req, false
	}

	req.Email = strings.TrimSpace(req.Email)
	// パスワードは前後の空白も本人が意図した文字の可能性があるため TrimSpace しない。

	if fields := validateCredentials(req); len(fields) > 0 {
		ValidationError(c, fields)
		return req, false
	}
	return req, true
}

// validateCredentials は検証エラーをフィールド名ごとに返す。
func validateCredentials(req credentialsRequest) map[string]string {
	fields := map[string]string{}

	if reason := validateEmail(req.Email); reason != "" {
		fields["email"] = reason
	}
	if reason := validatePassword(req.Password); reason != "" {
		fields["password"] = reason
	}

	return fields
}

// validatePassword は password の検証理由を返す。問題なければ空文字。
//
// 上限が 72 バイトなのは bcrypt が入力を 72 バイトまでしか見ないため。
// 黙って切り詰めると 73 バイト目以降が違っていても認証が通ってしまうので、
// 切り詰めずに検証エラーにする。
func validatePassword(password string) string {
	switch {
	case password == "":
		return "password is required"
	case len([]rune(password)) < auth.MinPasswordLength:
		return "password must be at least 8 characters"
	case len(password) > auth.MaxPasswordBytes:
		return "password must be 72 bytes or less"
	}
	return ""
}
