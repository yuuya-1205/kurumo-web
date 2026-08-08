package handler

import (
	"encoding/json"
	"errors"
	"log/slog"
	"net/http"
	"net/mail"
	"strconv"
	"strings"

	"github.com/yuuya-1205/kurumo-web/backend/internal/model"
	"github.com/yuuya-1205/kurumo-web/backend/internal/store"
)

// userRequest は作成・更新の共通リクエスト。
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
func (h *User) List(w http.ResponseWriter, r *http.Request) {
	users, err := h.store.List(r.Context())
	if err != nil {
		internalError(w, "failed to list users", err)
		return
	}
	JSON(w, http.StatusOK, users)
}

// Get は GET /users/{id}。
func (h *User) Get(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}

	user, err := h.store.Get(r.Context(), id)
	if err != nil {
		writeStoreError(w, "failed to get user", err)
		return
	}
	JSON(w, http.StatusOK, user)
}

// Create は POST /users。
func (h *User) Create(w http.ResponseWriter, r *http.Request) {
	req, ok := decodeUser(w, r)
	if !ok {
		return
	}

	user := &model.User{Name: req.Name, Email: req.Email}
	if err := h.store.Create(r.Context(), user); err != nil {
		writeStoreError(w, "failed to create user", err)
		return
	}
	JSON(w, http.StatusCreated, user)
}

// Update は PUT /users/{id}。name と email の両方を置き換える。
func (h *User) Update(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}

	req, ok := decodeUser(w, r)
	if !ok {
		return
	}

	user, err := h.store.Update(r.Context(), id, req.Name, req.Email)
	if err != nil {
		writeStoreError(w, "failed to update user", err)
		return
	}
	JSON(w, http.StatusOK, user)
}

// Delete は DELETE /users/{id}。
func (h *User) Delete(w http.ResponseWriter, r *http.Request) {
	id, ok := parseID(w, r)
	if !ok {
		return
	}

	if err := h.store.Delete(r.Context(), id); err != nil {
		writeStoreError(w, "failed to delete user", err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// parseID はパスパラメータの id を取り出す。不正な場合は 400 を書いて false を返す。
func parseID(w http.ResponseWriter, r *http.Request) (uint64, bool) {
	id, err := strconv.ParseUint(r.PathValue("id"), 10, 64)
	if err != nil || id == 0 {
		Error(w, http.StatusBadRequest, "id must be a positive integer")
		return 0, false
	}
	return id, true
}

// decodeUser はリクエストボディを読んで検証する。
// 不正な場合は 400 を書いて false を返す。
func decodeUser(w http.ResponseWriter, r *http.Request) (userRequest, bool) {
	var req userRequest

	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields() // 綴り間違いを黙って無視しない
	if err := dec.Decode(&req); err != nil {
		Error(w, http.StatusBadRequest, "invalid JSON body")
		return req, false
	}

	req.Name = strings.TrimSpace(req.Name)
	req.Email = strings.TrimSpace(req.Email)

	if fields := validateUser(req); len(fields) > 0 {
		ValidationError(w, fields)
		return req, false
	}
	return req, true
}

// validateUser は検証エラーをフィールド名ごとに返す。
func validateUser(req userRequest) map[string]string {
	fields := map[string]string{}

	switch {
	case req.Name == "":
		fields["name"] = "name is required"
	case len([]rune(req.Name)) > 100:
		fields["name"] = "name must be 100 characters or less"
	}

	switch {
	case req.Email == "":
		fields["email"] = "email is required"
	case len(req.Email) > 255:
		fields["email"] = "email must be 255 characters or less"
	default:
		if _, err := mail.ParseAddress(req.Email); err != nil {
			fields["email"] = "email is not a valid address"
		}
	}

	return fields
}

// writeStoreError は store のエラーを HTTP ステータスに対応付ける。
func writeStoreError(w http.ResponseWriter, msg string, err error) {
	switch {
	case errors.Is(err, store.ErrNotFound):
		Error(w, http.StatusNotFound, "user not found")
	case errors.Is(err, store.ErrEmailTaken):
		Error(w, http.StatusConflict, "email already taken")
	default:
		internalError(w, msg, err)
	}
}

// internalError は詳細をログにのみ残し、クライアントには汎用メッセージを返す。
func internalError(w http.ResponseWriter, msg string, err error) {
	slog.Error(msg, "error", err)
	Error(w, http.StatusInternalServerError, "internal server error")
}
