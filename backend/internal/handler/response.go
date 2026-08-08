package handler

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// ErrorBody はエラーレスポンスの共通フォーマット。
// Fields は検証エラーの場合のみ、フィールド名ごとの理由を持つ。
// frontend の ErrorBody 型と対応しているので、形を変えるときは frontend も直すこと。
type ErrorBody struct {
	Error  string            `json:"error"`
	Fields map[string]string `json:"fields,omitempty"`
}

// Error はエラーメッセージを JSON で返す。
func Error(c *gin.Context, status int, msg string) {
	c.JSON(status, ErrorBody{Error: msg})
}

// ValidationError は検証エラーを 400 で返す。
func ValidationError(c *gin.Context, fields map[string]string) {
	c.JSON(http.StatusBadRequest, ErrorBody{
		Error:  "validation failed",
		Fields: fields,
	})
}
