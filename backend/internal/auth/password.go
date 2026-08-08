// Package auth はパスワードのハッシュ化・照合と、JWT の発行・検証を担う。
//
// HTTP には依存しない。リクエストからトークンを取り出す処理は
// handler / server 側の middleware の仕事。
package auth

import "golang.org/x/crypto/bcrypt"

// MaxPasswordBytes は受け付けるパスワードの最大バイト数。
//
// bcrypt は入力を 72 バイトまでしか見ないため、これを超える分は無視される。
// 黙って切り詰めると「73 バイト目以降が違っても認証が通る」ことになるので、
// 上限を超える入力は handler 側で検証エラーにする（切り詰めない）。
const MaxPasswordBytes = 72

// MinPasswordLength は受け付けるパスワードの最小文字数。
const MinPasswordLength = 8

// HashPassword は平文パスワードから bcrypt のハッシュを作る。
func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(hash), nil
}

// VerifyPassword はハッシュと平文パスワードが一致するかを返す。
//
// 失敗の理由（ハッシュが壊れている / パスワードが違う）は区別せず false を返す。
// 呼び出し側が理由によって応答を変えると、そこから情報が漏れるため。
func VerifyPassword(hash, password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)) == nil
}
