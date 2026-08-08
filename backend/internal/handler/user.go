package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/mail"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/yuuya-1205/kurumo-web/backend/internal/model"
	"github.com/yuuya-1205/kurumo-web/backend/internal/store"
)

// userRequest は作成・更新の共通リクエスト。
//
// Gin の ShouldBindJSON は使わない。未知のフィールドを黙って無視するのと、
// TrimSpace 後の検証や「全フィールド分のエラーを返す」形が binding タグでは
// 表現できないため。decodeUser で自前に読む。
type userRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

// User はユーザーの CRUD ハンドラをまとめる。
type User struct {
	store *store.User
}

// NewUser は User を生成する。
func NewUser(s *store.User) *User {
	return &User{store: s}
}

// List は GET /users。
func (h *User) List(c *gin.Context) {
	users, err := h.store.List(c.Request.Context())
	if err != nil {
		internalError(c, "failed to list users", err)
		return
	}
	c.JSON(http.StatusOK, users)
}

// Get は GET /users/:id。
func (h *User) Get(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	user, err := h.store.Get(c.Request.Context(), id)
	if err != nil {
		writeStoreError(c, "failed to get user", err)
		return
	}
	c.JSON(http.StatusOK, user)
}

// Create は POST /users。
func (h *User) Create(c *gin.Context) {
	req, ok := decodeUser(c)
	if !ok {
		return
	}

	user := &model.User{Name: req.Name, Email: req.Email}
	if err := h.store.Create(c.Request.Context(), user); err != nil {
		writeStoreError(c, "failed to create user", err)
		return
	}
	c.JSON(http.StatusCreated, user)
}

// Update は PUT /users/:id。name と email の両方を置き換える。
func (h *User) Update(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	req, ok := decodeUser(c)
	if !ok {
		return
	}

	user, err := h.store.Update(c.Request.Context(), id, req.Name, req.Email)
	if err != nil {
		writeStoreError(c, "failed to update user", err)
		return
	}
	c.JSON(http.StatusOK, user)
}

// Delete は DELETE /users/:id。
func (h *User) Delete(c *gin.Context) {
	id, ok := parseID(c)
	if !ok {
		return
	}

	if err := h.store.Delete(c.Request.Context(), id); err != nil {
		writeStoreError(c, "failed to delete user", err)
		return
	}
	c.Status(http.StatusNoContent)
}

// parseID はパスパラメータの id を取り出す。不正な場合は 400 を書いて false を返す。
func parseID(c *gin.Context) (uint64, bool) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil || id == 0 {
		Error(c, http.StatusBadRequest, "id must be a positive integer")
		return 0, false
	}
	return id, true
}

// decodeUser はリクエストボディを読んで検証する。
// 不正な場合は 400 を書いて false を返す。
func decodeUser(c *gin.Context) (userRequest, bool) {
	var req userRequest

	dec := json.NewDecoder(c.Request.Body)
	dec.DisallowUnknownFields() // 綴り間違いを黙って無視しない
	if err := dec.Decode(&req); err != nil {
		Error(c, http.StatusBadRequest, "invalid JSON body")
		return req, false
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)

	if fields := validateUser(req); len(fields) > 0 {
		ValidationError(c, fields)
		return req, false
	}
	return req, true
}

// validateUser は検証エラーをフィールド名ごとに返す。
func validateUser(req userRequest) map[string]string {
	fields := map[string]string{}

	if reason := validateName(req.Name); reason != "" {
		fields["name"] = reason
	}
	if reason := validateEmail(req.Email); reason != "" {
		fields["email"] = reason
	}

	return fields
}

// validateName は name の検証理由を返す。問題なければ空文字。
// 上限は model.User の size:100 に合わせる。日本語を数えるので rune 数で見る。
func validateName(name string) string {
	switch {
	case name == "":
		return "name is required"
	case len([]rune(name)) > 100:
		return "name must be 100 characters or less"
	}
	return ""
}

// validateEmail は email の検証理由を返す。問題なければ空文字。
// 上限は model.User の size:255 に合わせる。
func validateEmail(email string) string {
	switch {
	case email == "":
		return "email is required"
	case len(email) > 255:
		return "email must be 255 characters or less"
	default:
		if _, err := mail.ParseAddress(email); err != nil {
			return "email is not a valid address"
		}
	}
	return ""
}

// writeStoreError は store のエラーを HTTP ステータスに対応付ける。
func writeStoreError(c *gin.Context, msg string, err error) {
	switch {
	case errors.Is(err, store.ErrNotFound):
		Error(c, http.StatusNotFound, "user not found")
	case errors.Is(err, store.ErrEmailTaken):
		Error(c, http.StatusConflict, "email already taken")
	default:
		internalError(c, msg, err)
	}
}

// internalError は詳細をログにのみ残し、クライアントには汎用メッセージを返す。
func internalError(c *gin.Context, msg string, err error) {
	slog.Error(msg, "error", err)
	Error(c, http.StatusInternalServerError, "internal server error")
}
