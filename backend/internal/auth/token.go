package auth

import (
	"errors"
	"strconv"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// ErrInvalidToken はトークンが不正・期限切れ・署名不一致のいずれか。
//
// 理由を分けないのは、クライアントに返す応答を一律 401 unauthorized に
// 揃えるため。詳細を返しても攻撃者以外の役には立たない。
var ErrInvalidToken = errors.New("invalid token")

// signingMethod は署名アルゴリズム。HS256 固定。
//
// 検証時にもこのアルゴリズムだけを許可する。許可しないと、攻撃者が
// alg を差し替えたトークンを通せてしまう（alg confusion）。
var signingMethod = jwt.SigningMethodHS256

// Tokenizer は JWT の発行と検証を行う。
type Tokenizer struct {
	secret []byte
	expiry time.Duration
}

// NewTokenizer は Tokenizer を生成する。
// secret は HS256 の署名鍵、expiry はトークンの有効期間。
func NewTokenizer(secret string, expiry time.Duration) *Tokenizer {
	return &Tokenizer{secret: []byte(secret), expiry: expiry}
}

// Issue はユーザー ID を sub に入れたトークンを発行する。
// exp には現在時刻 + expiry を入れる。
func (t *Tokenizer) Issue(userID uint64) (string, error) {
	now := time.Now()
	claims := jwt.RegisteredClaims{
		Subject:   strconv.FormatUint(userID, 10),
		IssuedAt:  jwt.NewNumericDate(now),
		ExpiresAt: jwt.NewNumericDate(now.Add(t.expiry)),
	}
	return jwt.NewWithClaims(signingMethod, claims).SignedString(t.secret)
}

// Parse はトークンを検証してユーザー ID を返す。
// 署名・有効期限・sub のいずれかが不正なら ErrInvalidToken。
func (t *Tokenizer) Parse(token string) (uint64, error) {
	var claims jwt.RegisteredClaims

	// 署名の検証（アルゴリズムの限定を含む）はライブラリに任せる。自前で書かない。
	parsed, err := jwt.ParseWithClaims(token, &claims, func(*jwt.Token) (any, error) {
		return t.secret, nil
	}, jwt.WithValidMethods([]string{signingMethod.Alg()}))
	if err != nil || !parsed.Valid {
		return 0, ErrInvalidToken
	}

	id, err := strconv.ParseUint(claims.Subject, 10, 64)
	if err != nil || id == 0 {
		return 0, ErrInvalidToken
	}
	return id, nil
}
