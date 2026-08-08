package handler

import (
	"encoding/json"
	"log/slog"
	"net/http"
)

// JSON は値を JSON としてレスポンスに書き出す。
func JSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if body == nil {
		return
	}
	if err := json.NewEncoder(w).Encode(body); err != nil {
		slog.Error("failed to encode response", "error", err)
	}
}

// ErrorBody はエラーレスポンスの共通フォーマット。
type ErrorBody struct {
	Error string `json:"error"`
}

// Error はエラーメッセージを JSON で返す。
func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, ErrorBody{Error: msg})
}
