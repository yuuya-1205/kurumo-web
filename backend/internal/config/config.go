package config

import (
	"errors"
	"os"
	"strconv"
	"time"
)

// Config はサーバー起動に必要な設定を保持する。
type Config struct {
	Port            string
	ReadTimeout     time.Duration
	WriteTimeout    time.Duration
	ShutdownTimeout time.Duration
	DB              DBConfig
	JWT             JWTConfig
}

// JWTConfig は認証トークンの設定を保持する。
type JWTConfig struct {
	Secret string        // HS256 の署名鍵。既定値は持たせない（Validate を参照）
	Expiry time.Duration // トークンの有効期間
}

// DBConfig はデータベース接続の設定を保持する。
type DBConfig struct {
	Host            string
	Port            string
	User            string
	Password        string
	Name            string
	LogLevel        string // silent / error / warn / info（info で発行 SQL を全て出す）
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
}

// Load は環境変数から設定を読み込む。未設定の項目は既定値を使う。
func Load() Config {
	return Config{
		Port:            getEnv("PORT", "8080"),
		ReadTimeout:     getEnvDuration("READ_TIMEOUT_SEC", 10*time.Second),
		WriteTimeout:    getEnvDuration("WRITE_TIMEOUT_SEC", 10*time.Second),
		ShutdownTimeout: getEnvDuration("SHUTDOWN_TIMEOUT_SEC", 15*time.Second),
		DB: DBConfig{
			Host:     getEnv("DB_HOST", "127.0.0.1"),
			Port:     getEnv("DB_PORT", "3306"),
			User:     getEnv("DB_USER", "root"),
			Password: os.Getenv("DB_PASSWORD"), // 空パスワードも許容するため getEnv は使わない
			Name:     getEnv("DB_NAME", "kurumo_api"),
			LogLevel: getEnv("DB_LOG_LEVEL", "warn"),

			MaxOpenConns:    getEnvInt("DB_MAX_OPEN_CONNS", 25),
			MaxIdleConns:    getEnvInt("DB_MAX_IDLE_CONNS", 5),
			ConnMaxLifetime: getEnvDuration("DB_CONN_MAX_LIFETIME_SEC", 5*time.Minute),
		},
		JWT: JWTConfig{
			// 署名鍵に既定値を持たせない。既定値のまま本番に出ると、
			// 誰でも任意のユーザーになりすませるトークンを作れてしまう。
			Secret: os.Getenv("JWT_SECRET"),
			Expiry: getEnvHours("JWT_EXPIRY_HOURS", 24*time.Hour),
		},
	}
}

// Validate は起動前に設定の不足を検出する。
//
// Load ではなくここで見ているのは、DB へのマイグレーション（cmd/migrate）に
// JWT_SECRET が不要なため。サーバー（cmd/server）だけがこれを呼ぶ。
func (c Config) Validate() error {
	if c.JWT.Secret == "" {
		return errors.New("JWT_SECRET is required")
	}
	return nil
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

func getEnvInt(key string, fallback int) int {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	n, err := strconv.Atoi(v)
	if err != nil || n <= 0 {
		return fallback
	}
	return n
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	sec, err := strconv.Atoi(v)
	if err != nil || sec <= 0 {
		return fallback
	}
	return time.Duration(sec) * time.Second
}

// getEnvHours は「時間」単位の環境変数を読む。秒単位の getEnvDuration と使い分ける。
func getEnvHours(key string, fallback time.Duration) time.Duration {
	v := os.Getenv(key)
	if v == "" {
		return fallback
	}
	hours, err := strconv.Atoi(v)
	if err != nil || hours <= 0 {
		return fallback
	}
	return time.Duration(hours) * time.Hour
}
