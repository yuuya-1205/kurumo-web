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
// Fields は検証エラーの場合のみ、フィールド名ごとの理由を持つ。
type ErrorBody struct {
	Error  string            `json:"error"`
	Fields map[string]string `json:"fields,omitempty"`
}

// Error はエラーメッセージを JSON で返す。
func Error(w http.ResponseWriter, status int, msg string) {
	JSON(w, status, ErrorBody{Error: msg})
}

// ValidationError は検証エラーを 400 で返す。
func ValidationError(w http.ResponseWriter, fields map[string]string) {
	JSON(w, http.StatusBadRequest, ErrorBody{
		Error:  "validation failed",
		Fields: fields,
	})
}
